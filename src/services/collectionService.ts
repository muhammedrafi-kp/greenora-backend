import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { ICollection } from "../models/Collection";
import { IPayment } from "../interfaces/collection/ICollectionService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { userClient, collectorClient } from "../gRPC/client/userClient";
import RabbitMQ from "../utils/rabbitmq";
import { IUser, ICollector, INotification } from "../interfaces/external/external";
import s3 from "../config/s3Config";
import { PutObjectCommand } from "@aws-sdk/client-s3";


export class CollectionService implements ICollectionservice {
    constructor(
        private _collectionRepository: ICollectionRepository,
        private _categoryRepository: ICategoryRepository,
        private _redisRepository: IRedisRepository

    ) { };

    async initiateRazorpayAdvance(userId: string, collectionData: Partial<ICollection>): Promise<{ orderId: string, amount: number }> {
        try {
            const totalAmout = await this.validateCollection(collectionData);

            console.log("totalCost :", totalAmout);

            const collectionId = uuidv4().replace(/-/g, '').substring(0, 16);

            Object.assign(collectionData, {
                collectionId,
                userId,
                estimatedCost: totalAmout,
                payment: {
                    advancePaymentStatus: "pending",
                    advancePaymentMethod: "online",
                    advanceAmount: 50,
                    amount: totalAmout,
                    status: "pending",
                }
            });

            const collection = await this._collectionRepository.create(collectionData);

            const redisKey = `collectionId:${userId}`;
            await this._redisRepository.set(redisKey, collection.collectionId, 600);


            const response = await axios.post<{ success: boolean, orderId: string }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/order`, {
                amount: 50
            });

            if (!response.data.success) {
                const error: any = new Error(MESSAGES.PAYMENT_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            return { orderId: response.data.orderId, amount: 50 };

        } catch (error) {
            console.error('Error while initiating payment:', error);
            throw error;
        }
    }

    async payAdvanceWithWallet(userId: string, collectionData: Partial<ICollection>): Promise<void> {
        try {

            const totalAmout = await this.validateCollection(collectionData);

            console.log("totalCost :", totalAmout);

            const resonse = await axios.post<{ success: boolean, message: string, transactionId: string, paymentId: string }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/wallet`, {
                userId,
                amount: 50,
                serviceType: "collection advance"
            });

            console.log("resonse from wallet payment:", resonse.data);

            if (!resonse.data.success) {
                const error: any = new Error(resonse.data.message);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const collectionId = uuidv4().replace(/-/g, '').substring(0, 16);

            Object.assign(collectionData, {
                collectionId,
                userId,
                estimatedCost: totalAmout,
                payment: {
                    paymentId: resonse.data.paymentId,
                    advanceAmount: 50,
                    advancePaymentMethod: "wallet",
                    advancePaymentStatus: "success",
                    amount: totalAmout,
                    status: "pending",
                }
            });

            const collection = await this._collectionRepository.create(collectionData);

            console.log("collection created:", collection);

            if (collection && collection.preferredDate) {
                const preferredDate = collection.preferredDate.toISOString();
                setImmediate(() => {
                    this.scheduleCollection(collection.collectionId, userId, collection.serviceAreaId, preferredDate);
                });
            }

        } catch (error) {
            console.error('Error while processing wallet payment:', error);
            throw error;
        }
    }

    async payWithWallet(userId: string, collectionId: string): Promise<void> {
        try {
            const collection = await this._collectionRepository.findOne({ collectionId });

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (!collection.payment?.amount || !collection.payment?.advanceAmount) {
                const error: any = new Error(MESSAGES.COLLECTION_DATA_REQUIRED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const response = await axios.post<{ success: boolean, message: string, walletData: { balance: number } }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/wallet`, {
                userId,
                amount: (collection.payment.amount - collection.payment.advanceAmount),
                serviceType: "collection payment"
            });

            console.log("response from wallet payment:", response.data);
            
        } catch (error) {
            console.error('Error while paying with wallet:', error);
            throw error;
        }
    }

    async verifyRazorpayAdvance(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void> {
        try {
            const response = await axios.post<{ success: boolean, message: string, paymentId: string }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/verification`, razorpayVerificationData);

            if (!response.data.success) {
                const error: any = new Error(MESSAGES.PAYMENT_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const redisKey = `collectionId:${userId}`;

            let collectionId: string | null = await this._redisRepository.get(redisKey);

            if (!collectionId) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const collection = await this._collectionRepository.updateOne({ collectionId }, {
                payment: {
                    paymentId: response.data.paymentId,
                    advancePaymentStatus: "success",
                    advancePaymentMethod: "online",
                    advanceAmount: 50
                }
            });

            await this._redisRepository.delete(redisKey);

            if (collection && collection.preferredDate) {
                const preferredDate = collection.preferredDate.toISOString();
                setImmediate(() => {
                    this.scheduleCollection(collectionId, userId, collection.serviceAreaId, preferredDate);
                });
            }

        } catch (error) {
            console.error('Error while verifying advance payment:', error);
            throw error;
        }
    }

    async validateCollection(collectionData: Partial<ICollection>): Promise<number> {
        try {

            if (!collectionData.items || collectionData.items.length === 0) {
                throw new Error("Items data is missing in the collection request.");
            }

            let totalAmout = 0;

            for (const item of collectionData.items) {
                if (!item.categoryId || !item.qty) {
                    const error: any = new Error(MESSAGES.INVALID_ITEM_DATA);
                    error.status = HTTP_STATUS.BAD_REQUEST;
                    throw error;
                }

                const categoryData = await this._categoryRepository.findById(item.categoryId);

                if (!categoryData) {
                    const error: any = new Error(MESSAGES.CATEGORY_NOT_FOUND);
                    error.status = HTTP_STATUS.NOT_FOUND;
                    throw error;
                }

                totalAmout += categoryData.rate * Number(item.qty);
            }

            return totalAmout;

        } catch (error) {
            console.error('Error while creating pickup request:', error);
            throw error;
        }
    }

    async verifyRazorpayPayment(collectionId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void> {
        try {
            const response = await axios.post<{ success: boolean, message: string, paymentId: string }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/verification`, razorpayVerificationData);

            if (!response.data.success) {
                const error: any = new Error(MESSAGES.PAYMENT_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const collection = await this._collectionRepository.findOne({ collectionId });

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            await this._collectionRepository.updateOne({ collectionId }, {
                payment: {
                    ...collection.payment,
                    paymentId: response.data.paymentId,
                    status: "success"
                }
            });

        } catch (error) {
            console.error('Error while verifying collection payment:', error);
            throw error;
        }
    }

    
    async scheduleCollection(collectionId: string, userId: string, serviceAreaId: string, preferredDate: string): Promise<void> {
        try {
            const collector = await this.findAvailableCollector(serviceAreaId, preferredDate);
            console.log("collector :", collector);

            if (!collector) {
                throw new Error("No available collector found");
            }

            await this.assignCollectionToCollector(collectionId, collector.id, preferredDate);

            await this._collectionRepository.updateOne(
                { collectionId },
                {
                    collectorId: collector.id,
                    status: "scheduled",
                    preferredDate,
                    assignedCollector: collector.id
                }
            );

            // Step 4: Publish a notification message to RabbitMQ
            const queue = "notification";

            const notification: INotification = {
                userId: userId,
                title: "Pickup Scheduled",
                message: `Your waste pickup has been successfully scheduled with collector ${collector.name}. You can track the status and view details in your collection history.`,
                url: "/account/collections",
                createdAt: new Date()
            };

            RabbitMQ.publish(queue, notification);

        } catch (error) {
            console.error('Error while scheduling collection:', error);
            throw error;
        }
    }


































   

    async createCollection(userId: string, paymentId: string): Promise<ICollection> {
        try {
            console.log("they used us-1-createCollection")

            console.log("userId in collection service!!:", userId);
            const redisKey = `collection:${userId}`
            let collectionData: ICollection | null = await this._redisRepository.get(redisKey);

            if (!collectionData) {
                throw new Error(`No collection data found in Redis for userId: ${userId}`);
            }

            // Object.assign(collectionData, { userId, advancePaymentStatus: "paid" });

            Object.assign(collectionData, { userId, paymentId });


            console.log("Final collection data before saving:", collectionData);

            // Store collection data in the main repository (DB)
            const collection = await this._collectionRepository.create(collectionData);
            await this._redisRepository.delete(redisKey);

            return collection;

        } catch (error) {
            console.error('Error while creating pickup request:', error);
            throw error;
        }
    }

    async scheduleCollectionManually(collectionId: string, collectorId: string, userId: string, preferredDate: string): Promise<void> {
        try {
            await this.assignCollectionToCollector(collectionId, collectorId, preferredDate);

            console.log("collector assigned to collection :", collectorId);

            await this._collectionRepository.updateOne(
                { collectionId },
                {
                    collectorId: collectorId,
                    status: "scheduled",
                    preferredDate,
                    assignedCollector: collectorId
                }
            );

            // Step 4: Publish a notification message to RabbitMQ
            const queue = "notification";

            const notification: INotification = {
                userId: userId,
                title: "Pickup Scheduled",
                message: `Your waste pickup has been successfully scheduled. You can track the status and view details in your collection history.`,
                url: "/account/collections",
                createdAt: new Date()
            };


            await RabbitMQ.publish(queue, notification);


        } catch (error) {
            console.error('Error while scheduling collection manually:', error);
            throw error;
        }
    }

    async findAvailableCollector(serviceAreaId: string, preferredDate: string): Promise<ICollector> {
        try {
            const response: { success: boolean; collector: ICollector } = await new Promise((resolve, reject) => {
                collectorClient.GetAvailableCollector({ serviceAreaId, preferredDate }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(response);
                });
            });

            console.log("response in collection service :", response);
            if (!response.success) {
                throw new Error("getting collectors failed!");
            }

            return response.collector;

        } catch (error) {
            console.error('Error while fetching available collectors:', error);
            throw error;
        }
    }

    async assignCollectionToCollector(collectionId: string, collectorId: string, preferredDate: string): Promise<void> {
        try {

            const response: { success: boolean; message: string } = await new Promise((resolve, reject) => {
                collectorClient.AssignCollectionToCollector({
                    id: collectorId,
                    collectionId: collectionId,
                    preferredDate: preferredDate
                }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(response);
                });
            });

            console.log("response in collection service :", response);

            if (!response.success) {
                throw new Error("Failed to update collector state");
            }

        } catch (error) {
            console.error('Error while assigning collection to collector:', error);
            throw error;
        }
    }

    async getCollectionHistory(userId: string, options: {
        status?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
    }): Promise<ICollection[]> {
        try {

            const {
                status,
                type,
                startDate,
                endDate,
                page,
                limit,
            } = options;

            const filter: any = {};
            filter.userId = userId;
            if (status) filter.status = status;
            if (type) filter.type = type;

            const sort: Record<string, 1 | -1> = {};
            sort.createdAt = -1;

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }


            const skip = (page - 1) * limit;

            return await this._collectionRepository.findAll(filter, {}, sort, skip, limit)

        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }

    async updateCollection(collectionId: string, collectionData: Partial<ICollection>): Promise<ICollection | null> {
        try {
            console.log("collectionData :", collectionData)
            const updatedCollection = await this._collectionRepository.updateOne({ collectionId: collectionId }, collectionData)
            console.log("updatedCollection :", updatedCollection);

            return updatedCollection;

        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }

    async getCollectionHistories(options: {
        status?: string;
        districtId?: string;
        serviceAreaId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{ collections: Partial<ICollection>[], totalItems: number }> {
        try {

            const {
                status,
                districtId,
                serviceAreaId,
                startDate,
                endDate,
                sortBy,
                sortOrder,
                search,
                page,
                limit,
            } = options;

            console.log("options :", options);


            const filter: any = {};

            if (status) filter.status = status;
            if (districtId) filter.districtId = districtId;
            if (serviceAreaId) filter.serviceAreaId = serviceAreaId;
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }
            if (search) {
                filter.$or = [
                    { 'collectionId': { $regex: search, $options: 'i' } },
                ];
            }

            const sort: Record<string, 1 | -1> = {};
            if (sortBy) {
                sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            }

            const totalItems = await this._collectionRepository.countDocuments(filter);
            console.log("totalItems :", totalItems);

            const skip = (page - 1) * limit;


            const collections = await this._collectionRepository.findAll(filter, {}, sort, skip, limit);


            const userIds = [...new Set(collections.map(c => c.userId))];
            // console.log("userIds :", userIds);
            const response: { success: boolean; users: IUser[] } = await new Promise((resolve, reject) => {
                userClient.GetUsers({ userIds }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(response);
                });
            });

            // console.log("response from grpc:", response);

            const userMap = new Map<string, any>();

            response.users.forEach((user: any) => {
                userMap.set(user.userId, user);
            });

            const enrichedCollections = collections.map((collection) => {
                const plainCollection = collection.toObject(); // remove Mongoose internal stuff
                return {
                    ...plainCollection,
                    user: userMap.get(plainCollection.userId) || null
                };
            });


            // console.log("enrichedCollections:", enrichedCollections);

            return {
                collections: enrichedCollections,
                totalItems
            };

        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }

    async getAssignedCollections(collectorId: string, options: {
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<Partial<ICollection>[]> {
        try {
            const { page = 1, limit = 3, status, startDate, endDate } = options;
            const filter: any = { collectorId };

            if (status) filter.status = status;
            if (startDate || endDate) {
                filter.preferredDate = {};
                if (startDate) filter.preferredDate.$gte = new Date(startDate);
                if (endDate) filter.preferredDate.$lte = new Date(endDate);
            }

            const sort: Record<string, 1 | -1> = {};
            sort.preferredDate = -1;
            const skip = (page - 1) * limit;


            const collections = await this._collectionRepository.findAll(filter, {}, sort, skip, limit);

            const userIds = [...new Set(collections.map(c => c.userId))];
            const response: { success: boolean; users: IUser[] } = await new Promise((resolve, reject) => {
                userClient.GetUsers({ userIds }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(response);
                });
            });

            const userMap = new Map<string, any>();
            response.users.forEach((user: any) => {
                userMap.set(user.userId, user);
            });

            const enrichedCollections = collections.map((collection) => {
                const plainCollection = collection.toObject(); // remove Mongoose internal stuff
                return {
                    ...plainCollection,
                    user: userMap.get(plainCollection.userId) || null
                };
            });

            return enrichedCollections;

        } catch (error) {
            console.error('Error while fetching assigned collections:', error);
            throw error;
        }
    }

    async completeCollection(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentMethod: string): Promise<void> {
        try {
            const collection = await this._collectionRepository.findOne({ collectionId });

            console.log("collection :", collection);

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (paymentMethod === "digital") {

                console.log("yessssssssss!!!");

                if (collection.payment?.status === "success") {
                    await this._collectionRepository.updateOne({ collectionId }, { status: "completed" });
                } else {
                    const error: any = new Error(MESSAGES.PAYMENT_NOT_COMPLETED);
                    error.status = HTTP_STATUS.BAD_REQUEST;
                    throw error;
                }

            } else if (paymentMethod === "cash") {
                console.log("nooooooooo!!!");
                if (!collectionData.items) {
                    throw new Error(MESSAGES.INVALID_ITEM_DATA);
                }

                let totalAmount = 0;

                for (const item of collectionData.items) {
                    if (!item.categoryId || !item.qty) {
                        throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                    }

                    const categoryData = await this._categoryRepository.findById(item.categoryId);

                    if (!categoryData) {
                        throw new Error(`Category with ID ${item.categoryId} not found.`);
                    }

                    totalAmount += categoryData.rate * Number(item.qty);
                }


                const proofUrls = await Promise.all(
                    collectionProofs.map(async (proof, index) => {
                        const s3Params = {
                            Bucket: process.env.AWS_S3_BUCKET_NAME!,
                            Key: `collection-proofs/${collectionId}/${Date.now()}_${index}_${proof.originalname}`,
                            Body: proof.buffer,
                            ContentType: proof.mimetype,
                        };

                        const command = new PutObjectCommand(s3Params);
                        await s3.send(command);

                        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
                    })
                );

                console.log("proofUrls :", proofUrls);

                Object.assign(collectionData, {
                    estimatedCost: totalAmount,
                    status: "completed",
                    proofs: proofUrls,
                    payment: {
                        ...collection.payment,
                        amount: totalAmount,
                        method: "cash",
                        status: "success",
                        paidAt: new Date().toISOString(),
                    }
                });

                console.log("collectionData :", collectionData);

                await this._collectionRepository.updateOne({ collectionId }, collectionData);
            }

            const notification: INotification = {
                userId: collection.userId,
                title: "Pickup Completed",
                message: `Your waste pickup #${collection.collectionId.toUpperCase()} has been successfully completed. You can view the details in your collection history.`,
                url: "/account/collections",
                createdAt: new Date()
            };

            await RabbitMQ.publish('notification', notification);

        } catch (error) {
            console.error('Error while updating collection:', error);
            throw error;
        }
    }

    // async processWithCashPayment(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentData: IPayment): Promise<void> {
    //     try {
    //         const collection = await this._collectionRepository.findOne({ collectionId });
    //         console.log("collection :", collection);

    //         if (!collection) {
    //             const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
    //             error.status = HTTP_STATUS.NOT_FOUND;
    //             throw error;
    //         }

    //         if (!collectionData.items) {
    //             throw new Error(MESSAGES.INVALID_ITEM_DATA);
    //         }

    //         let totalCost = 0;

    //         for (const item of collectionData.items) {
    //             if (!item.categoryId || !item.qty) {
    //                 throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
    //             }

    //             const categoryData = await this._categoryRepository.findById(item.categoryId);

    //             if (!categoryData) {
    //                 throw new Error(`Category with ID ${item.categoryId} not found.`);
    //             }

    //             totalCost += categoryData.rate * Number(item.qty);
    //         }


    //         const proofUrls = await Promise.all(
    //             collectionProofs.map(async (proof, index) => {
    //                 const s3Params = {
    //                     Bucket: process.env.AWS_S3_BUCKET_NAME!,
    //                     Key: `collection-proofs/${collectionId}/${Date.now()}_${index}_${proof.originalname}`,
    //                     Body: proof.buffer,
    //                     ContentType: proof.mimetype,
    //                 };

    //                 const command = new PutObjectCommand(s3Params);
    //                 await s3.send(command);

    //                 // Return the public URL (adjust based on your S3 configuration)
    //                 return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
    //             })
    //         );

    //         console.log("proofUrls :", proofUrls);

    //         Object.assign(collectionData, { estimatedCost: totalCost, status: "completed", proofs: proofUrls });

    //         Object.assign(paymentData, { status: "completed", paidAt: new Date().toISOString(), amount: totalCost });

    //         console.log("collectionData :", collectionData);
    //         console.log("paymentData :", paymentData);

    //         await this._collectionRepository.updateOne({ collectionId }, collectionData);

    //         await RabbitMQ.publish("finalPayment-payment", paymentData);

    //         await RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });

    //         const notification: INotification = {
    //             userId: collection.userId,
    //             title: "Pickup Completed",
    //             message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
    //             url: "/account/collections",
    //             createdAt: new Date()
    //         };

    //         await RabbitMQ.publish('notification', notification);

    //     } catch (error) {
    //         console.error('Error while updating collection:', error);
    //         throw error;
    //     }
    // }

    // async processWithDigitalPayment(collectionId: string, paymentId: string): Promise<void> {
    //     try {

    //         const collection = await this._collectionRepository.findOne({ collectionId });
    //         console.log("collection :", collection);

    //         if (!collection) {
    //             const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
    //             error.status = HTTP_STATUS.NOT_FOUND;
    //             throw error;
    //         }

    //         const response = await axios.get(`http://localhost:3004/collection-payment/${paymentId}`);

    //         console.log("response from payment:", response.data);
    //         const payment: IPayment = response.data.data;

    //         if (payment.status === "success") {

    //             await this._collectionRepository.updateOne({ collectionId }, { status: "completed", isPaymentRequested: false });

    //             // await RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });

    //             const notification: INotification = {
    //                 userId: collection.userId,
    //                 title: "Pickup Completed",
    //                 message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
    //                 url: "/account/collections",
    //                 createdAt: new Date()
    //             };

    //             await RabbitMQ.publish('notification', notification);

    //         } else {
    //             const error: any = new Error(MESSAGES.PAYMENT_NOT_COMPLETED);
    //             error.status = HTTP_STATUS.BAD_REQUEST;
    //             throw error;
    //         }

    //     } catch (error) {
    //         console.error('Error while completing collection:', error);
    //         throw error;
    //     }
    // }

    async cancelCollection(collectionId: string, reason: string): Promise<void> {
        try {
            const collection = await this._collectionRepository.updateOne({ collectionId }, { status: "cancelled", cancellationReason: reason });

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            await RabbitMQ.publish("collection-cancelled-collector", {
                collectionId: collection.collectionId,
                collectorId: collection.collectorId,
                preferredDate: collection.preferredDate,
                userId: collection.userId,
            });

            await RabbitMQ.publish("collection-cancelled-payment", {
                userId: collection.userId,
                paymentId: collection.payment.paymentId
            });


        } catch (error) {
            console.error('Error while cancelling collection:', error);
            throw error;
        }
    }

    async requestCollectionPayment(collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[]): Promise<void> {
        try {

            const collection = await this._collectionRepository.findOne({ collectionId: collectionData.collectionId });

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (!collectionData.items) {
                throw new Error(MESSAGES.INVALID_ITEM_DATA);
            }

            let totalAmount = 0;

            for (const item of collectionData.items) {
                if (!item.categoryId || !item.qty) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const categoryData = await this._categoryRepository.findById(item.categoryId);

                if (!categoryData) {
                    throw new Error(`Category with ID ${item.categoryId} not found.`);
                }

                totalAmount += categoryData.rate * Number(item.qty);
            }

            console.log("totalAmount :", totalAmount);

            const response = await axios.post<{ success: boolean, orderId: string }>(`${process.env.PAYMENT_SERVICE_URL}/collection-payment/order`, {
                amount: totalAmount - (collection.payment?.advanceAmount ?? 0)
            });

            if (!response.data.success) {
                const error: any = new Error(MESSAGES.PAYMENT_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            console.log("response from payment service:", response.data);

            const proofUrls = await Promise.all(
                collectionProofs.map(async (proof, index) => {
                    const s3Params = {
                        Bucket: process.env.AWS_S3_BUCKET_NAME!,
                        Key: `collection-proofs/${collection.collectionId}/${Date.now()}_${index}_${proof.originalname}`,
                        Body: proof.buffer,
                        ContentType: proof.mimetype,
                    };

                    const command = new PutObjectCommand(s3Params);
                    await s3.send(command);

                    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
                })
            );

            Object.assign(collectionData, {
                proofs: proofUrls,
                estimatedCost: totalAmount,
                payment: {
                    ...collection.payment,
                    amount: totalAmount,
                    orderId: response.data.orderId,
                    status: "requested"
                }
            });

            console.log("collectionData :", collectionData);

            await this._collectionRepository.updateOne(
                { collectionId: collection.collectionId },
                collectionData
            );

            const queue = "notification";

            const notification: INotification = {
                userId: collection.userId,
                title: "Payment Request for Waste Pickup",
                message: `The waste pickup is ready and a payment request has been generated. Please complete the payment to proceed.`,
                url: `/account/collections`,
                createdAt: new Date()
            };

            await RabbitMQ.publish(queue, notification);


        } catch (error) {
            console.error('Error while requesting collection payment:', error);
            throw error;
        }
    }




    async getRevenueData(
        options: {
            districtId?: string;
            serviceAreaId?: string;
            dateFilter?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ): Promise<{
        date: string;
        waste: number;
        scrap: number;
        total: number;
        wasteCollections: number;
        scrapCollections: number;
    }[]> {
        try {

            let startDate: Date | undefined;
            let endDate: Date | undefined = new Date();

            switch (options.dateFilter) {
                case 'today':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'yesterday':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'last7days':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'thismonth':
                    startDate = new Date();
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'lastmonth':
                    startDate = new Date();
                    startDate.setMonth(startDate.getMonth() - 1);
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + 1);
                    endDate.setDate(0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'thisyear':
                    startDate = new Date();
                    startDate.setMonth(0);
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'custom':
                    // Use the provided start and end dates
                    startDate = options.startDate;
                    endDate = options.endDate;
                    break;
                default:
                    // Default to today if no filter is provided
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
            }

            const data = await this._collectionRepository.getRevenueData({
                districtId: options.districtId,
                serviceAreaId: options.serviceAreaId,
                startDate,
                endDate
            });

            return data;

        } catch (error) {
            console.error('Error while fetching revenue data:', error);
            throw error;
        }
    }

}