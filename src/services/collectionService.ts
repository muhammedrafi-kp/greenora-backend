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
        private collectionRepository: ICollectionRepository,
        private categoryRepository: ICategoryRepository,
        private redisRepository: IRedisRepository

    ) { };

    async validateCollection(userId: string, collectionData: ICollection): Promise<string> {
        try {
            console.log("they used us-1-validateCollection")
            if (!collectionData.items || collectionData.items.length === 0) {
                throw new Error("Items data is missing in the collection request.");
            }
            let totalCost = 0;

            for (const item of collectionData.items) {
                if (!item.categoryId || !item.qty) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const categoryData = await this.categoryRepository.findById(item.categoryId);

                if (!categoryData) {
                    throw new Error(`Category with ID ${item.categoryId} not found.`);
                }

                totalCost += categoryData.rate * Number(item.qty);
            }

            const collectionId = uuidv4().replace(/-/g, '').substring(0, 16);

            Object.assign(collectionData, { collectionId, estimatedCost: totalCost, });

            const redisKey = `collection:${userId}`
            await this.redisRepository.set(redisKey, collectionData, 600);


            return collectionId;

        } catch (error) {
            console.error('Error while creating pickup request:', error);
            throw error;
        }
    }

    async createCollection(userId: string, paymentId: string): Promise<ICollection> {
        try {
            console.log("they used us-1-createCollection")

            console.log("userId in collection service!!:", userId);
            const redisKey = `collection:${userId}`
            let collectionData: ICollection | null = await this.redisRepository.get(redisKey);

            if (!collectionData) {
                throw new Error(`No collection data found in Redis for userId: ${userId}`);
            }

            // Object.assign(collectionData, { userId, advancePaymentStatus: "paid" });

            Object.assign(collectionData, { userId, paymentId });


            console.log("Final collection data before saving:", collectionData);

            // Store collection data in the main repository (DB)
            const collection = await this.collectionRepository.create(collectionData);
            await this.redisRepository.delete(redisKey);

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

            await this.collectionRepository.updateOne(
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
                url: "/account/waste-collection-history",
                createdAt: new Date()
            };


            await RabbitMQ.publish(queue, notification);


        } catch (error) {
            console.error('Error while scheduling collection manually:', error);
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

            await this.collectionRepository.updateOne(
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
                url: "/account/waste-collection-history",
                createdAt: new Date()
            };


            await RabbitMQ.publish(queue, notification);

        } catch (error) {
            console.error('Error while scheduling collection:', error);
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

    async getCollectionHistory(userId: string): Promise<ICollection[]> {
        try {
            // return await this.collectionRepository.findAll({ userId })
            return await this.collectionRepository.getCollections(userId)

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

            const totalItems = await this.collectionRepository.countDocuments(filter);
            console.log("totalItems :", totalItems);

            const skip = (page - 1) * limit;


            const collections = await this.collectionRepository.findAll(filter, {}, sort, skip, limit);


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

    async getAssignedCollections(collectorId: string): Promise<Partial<ICollection>[]> {
        try {
            const filter = { collectorId };

            const collections = await this.collectionRepository.findAll(filter, {}, { preferredDate: 1 });
            const userIds = [...new Set(collections.map(c => c.userId))];
            console.log("userIds :", userIds);
            const response: { success: boolean; users: IUser[] } = await new Promise((resolve, reject) => {
                userClient.GetUsers({ userIds }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(response);
                });
            });

            console.log("response from grpc:", response);

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

    async processCashPayment(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentData: IPayment): Promise<void> {
        try {
            const collection = await this.collectionRepository.findById(collectionId);
            console.log("collection :", collection);

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
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

                    // Return the public URL (adjust based on your S3 configuration)
                    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
                })
            );

            console.log("proofUrls :", proofUrls);

            Object.assign(collectionData, { proofs: proofUrls });

            console.log("collectionData :", collectionData);

            // await this.collectionRepository.updateById(collectionId, collectionData);

            // await RabbitMQ.publish("finalPayment-payment", paymentData);
            // await RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });

            // const notification: INotification = {
            //     userId: collection.userId,
            //     title: "Pickup Completed",
            //     message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
            //     url: "/account/waste-collection-history",
            //     createdAt: new Date()
            // };

            // await RabbitMQ.publish('notification', notification);

        } catch (error) {
            console.error('Error while updating collection:', error);
            throw error;
        }
    }

    async processDigitalPayment(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentData: IPayment): Promise<void> {
        try {

            const collection = await this.collectionRepository.findById(collectionId);
            console.log("collection :", collection);

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const response = await axios.get(`http://localhost:3004/collection-payment/${paymentData.paymentId}`);

            console.log("response from payment:", response.data);
            const payment: IPayment = response.data.data;

            if (payment.status === "success") {

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

                Object.assign(collectionData, { proofs: proofUrls });

                console.log("collectionData :", collectionData);

                await this.collectionRepository.updateById(collectionId, collectionData);

                await RabbitMQ.publish("finalPayment-payment", paymentData);
                await RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });
                const notification: INotification = {
                    userId: collection.userId,
                    title: "Pickup Completed",
                    message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
                    url: "/account/collections",
                    createdAt: new Date()
                };

                await RabbitMQ.publish('notification', notification);

            } else {
                const error: any = new Error(MESSAGES.PAYMENT_NOT_COMPLETED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

        } catch (error) {
            console.error('Error while completing collection:', error);
            throw error;
        }
    }


    async cancelCollection(collectionId: string, reason: string): Promise<void> {
        try {
            const collection = await this.collectionRepository.updateOne({ collectionId }, { status: "cancelled", cancellationReason: reason });

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
                paymentId: collection.paymentId
            });


        } catch (error) {
            console.error('Error while cancelling collection:', error);
            throw error;
        }
    }

    async requestCollectionPayment(collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[]): Promise<void> {
        try {

            const collection = await this.collectionRepository.findOne({ collectionId: collectionData.collectionId });

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (!collectionData.items) {
                throw new Error(MESSAGES.INVALID_ITEM_DATA);
            }

            let totalCost = 0;

            for (const item of collectionData.items) {
                if (!item.categoryId || !item.qty) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const categoryData = await this.categoryRepository.findById(item.categoryId);

                if (!categoryData) {
                    throw new Error(`Category with ID ${item.categoryId} not found.`);
                }

                totalCost += categoryData.rate * Number(item.qty);
            }

            console.log("totalCost :", totalCost);

            const response = await axios.post<{ success: boolean, message: string }>(`http://localhost:3004/collection-payment/payment-request`, {
                userId: collection.userId,
                paymentId: collection.paymentId,
                amount: totalCost
            });
            console.log("response from payment:", response.data);

            if (response.data.success) {
                console.log("successs!!!")
                await this.collectionRepository.updateOne(
                    { collectionId: collection.collectionId },
                    { isPaymentRequested: true }
                )
            }

        } catch (error) {
            console.error('Error while requesting collection payment:', error);
            throw error;
        }
    }
}