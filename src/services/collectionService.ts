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
import mongoose from "mongoose";
import RabbitMQ from "../utils/rabbitmq";
import { IUser, ICollector, INotification } from "../interfaces/external/external";



export class CollectionService implements ICollectionservice {
    constructor(
        private collectionRepository: ICollectionRepository,
        private categoryRepository: ICategoryRepository,
        private redisRepository: IRedisRepository

    ) { };

    async validateCollection(userId: string, collectionData: ICollection): Promise<string> {
        try {
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


            RabbitMQ.publish(queue, notification);

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

    async validateCollectionData(userId: string, collectionData: Partial<ICollection>): Promise<{ success: boolean; message: string; collectionId: string; totalCost: number }> {
        try {
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

            await this.redisRepository.set(userId, collectionData, 600);

            return {
                success: true,
                message: MESSAGES.COLLECTION_VALIDATED,
                collectionId,
                totalCost
            };

        } catch (error) {
            console.error('Error while validating collection data:', error);
            throw error;
        }
    }

    async createCollectionRequest(userId: string): Promise<{ success: boolean, message: string, data: ICollection }> {
        try {
            console.log("userId in collection service!!:", userId);
            let collectionData: ICollection | null = await this.redisRepository.get(userId);

            if (!collectionData) {
                throw new Error(`No collection data found in Redis for userId: ${userId}`);
            }

            Object.assign(collectionData, { userId, advancePaymentStatus: "paid" });

            console.log("Final collection data before saving:", collectionData);

            // Store collection data in the main repository (DB)
            const collection = await this.collectionRepository.create(collectionData);

            return {
                success: true,
                message: MESSAGES.COLLECTION_CREATED,
                data: collection
            };
        } catch (error) {
            console.error('Error while creating pickup request:', error);
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




    async processPendingRequests(): Promise<void> {
        try {
            const pendingRequests = await this.collectionRepository.getPendingRequests();
            console.log("pending requests :", pendingRequests);

            for (const request of pendingRequests) {
                await this.assignCollectorToRequest(request);
            }
        } catch (error) {
            console.error('Error while fetching available collectors:', error);
            throw error;
        }
    }

    // async assignCollectorToRequest(request: ICollection): Promise<void> {
    //     try {
    //         const { serviceAreaId } = request;

    //         const response: { success: boolean; collectors: ICollector[] } = await new Promise((resolve, reject) => {
    //             collectorClient.GetAvailableCollectors({ serviceAreaId }, (error: any, response: any) => {
    //                 if (error) {
    //                     return reject(error)
    //                 }

    //                 resolve(response);
    //             });
    //         });

    //         console.log("availableCollectors :", response);

    //         if (!response.success) {
    //             throw new Error("getting collectors failed!");
    //         }
    //         const availableCollectors = response.collectors;
    //         availableCollectors.sort((a, b) => a.currentTasks - b.currentTasks);

    //         if (availableCollectors.length > 0) {
    //             const assignedCollector = availableCollectors[0];
    //             assignedCollector.currentTasks += 1;
    //             if (assignedCollector.currentTasks >= assignedCollector.maxCapacity) {
    //                 assignedCollector.availabilityStatus = "unavailable";
    //             }

    //             const updateResponse: { success: boolean; message: string } = await new Promise((resolve, reject) => {
    //                 collectorClient.UpdateCollector({
    //                     id: assignedCollector.id,
    //                     currentTasks: assignedCollector.currentTasks,
    //                     availabilityStatus: assignedCollector.availabilityStatus
    //                 }, (error: any, response: any) => {
    //                     if (error) {
    //                         return reject(error)
    //                     }

    //                     resolve(response);
    //                 });
    //             });

    //             console.log("updateResponse : ", updateResponse);

    //             if (!updateResponse.success) {
    //                 throw new Error("Failed to update collector state");
    //             }

    //             // Step 5: Update request status and assign collector
    //             await this.collectionRepository.updateById(request._id as mongoose.Types.ObjectId, {
    //                 collectorId: assignedCollector.id,
    //                 status: "scheduled"
    //             });

    //             // Step 4: Publish a notification message to RabbitMQ
    //             const queue = "notification";

    //             const notification: INotification = {
    //                 userId: request.userId,
    //                 title: "Pickup Scheduled",
    //                 message: `Your waste pickup has been successfully scheduled with collector ${assignedCollector.name}. You can track the status and view details in your collection history.`,
    //                 url: "/account/waste-collection-history",
    //                 createdAt: new Date()
    //             };


    //             RabbitMQ.publish(queue, notification);

    //         } else {
    //             await this.collectionRepository.updateById(request._id as mongoose.Types.ObjectId, { status: "pending" });
    //         }
    //     } catch (error) {
    //         console.error('Error while assigning available collectors:', error);
    //         throw error;
    //     }
    // }

    async assignCollectorToRequest(request: ICollection): Promise<void> {
        try {
            const { serviceAreaId } = request;

            const response: { success: boolean; collectors: ICollector[] } = await new Promise((resolve, reject) => {
                collectorClient.GetAvailableCollectors({ serviceAreaId }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }

                    resolve(response);
                });
            });

            console.log("availableCollectors :", response);

            if (!response.success) {
                throw new Error("getting collectors failed!");
            }
            const availableCollectors = response.collectors;
            availableCollectors.sort((a, b) => a.currentTasks - b.currentTasks);

            if (availableCollectors.length > 0) {
                const assignedCollector = availableCollectors[0];
                assignedCollector.currentTasks += 1;
                if (assignedCollector.currentTasks >= assignedCollector.maxCapacity) {
                    assignedCollector.availabilityStatus = "unavailable";
                }

                const updateResponse: { success: boolean; message: string } = await new Promise((resolve, reject) => {
                    collectorClient.UpdateCollector({
                        id: assignedCollector.id,
                        currentTasks: assignedCollector.currentTasks,
                        availabilityStatus: assignedCollector.availabilityStatus
                    }, (error: any, response: any) => {
                        if (error) {
                            return reject(error)
                        }

                        resolve(response);
                    });
                });

                console.log("updateResponse : ", updateResponse);

                if (!updateResponse.success) {
                    throw new Error("Failed to update collector state");
                }

                // Step 5: Update request status and assign collector
                await this.collectionRepository.updateById(request._id as mongoose.Types.ObjectId, {
                    collectorId: assignedCollector.id,
                    status: "scheduled"
                });

                // Step 4: Publish a notification message to RabbitMQ
                const queue = "notification";

                const notification: INotification = {
                    userId: request.userId,
                    title: "Pickup Scheduled",
                    message: `Your waste pickup has been successfully scheduled with collector ${assignedCollector.name}. You can track the status and view details in your collection history.`,
                    url: "/account/waste-collection-history",
                    createdAt: new Date()
                };


                RabbitMQ.publish(queue, notification);

            } else {
                await this.collectionRepository.updateById(request._id as mongoose.Types.ObjectId, { status: "pending" });
            }
        } catch (error) {
            console.error('Error while assigning available collectors:', error);
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

    async processCashPayment(collectionId: string, collectionData: Partial<ICollection>, paymentData: IPayment): Promise<void> {
        try {
            const collection = await this.collectionRepository.findById(collectionId);
            console.log("collection :", collection);

            if (!collection) {
                const error: any = new Error(MESSAGES.COLLECTION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            await this.collectionRepository.updateById(collectionId, collectionData);

            RabbitMQ.publish("finalPayment-payment", paymentData);
            RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });

            const notification: INotification = {
                userId: collection.userId,
                title: "Pickup Completed",
                message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
                url: "/account/waste-collection-history",
                createdAt: new Date()
            };

            RabbitMQ.publish('notification', notification);

        } catch (error) {
            console.error('Error while updating collection:', error);
            throw error;
        }
    }

    async processDigitalPayment(collectionId: string, collectionData: Partial<ICollection>, paymentData: IPayment): Promise<void> {
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
                await this.collectionRepository.updateById(collectionId, collectionData);

                RabbitMQ.publish("finalPayment-payment", paymentData);
                RabbitMQ.publish("finalPayment-user", { collectorId: collection.collectorId });
                const notification: INotification = {
                    userId: collection.userId,
                    title: "Pickup Completed",
                    message: `Your waste pickup (ID: ${collection.collectionId}) has been successfully completed. You can view the details in your collection history.`,
                    url: "/account/waste-collection-history",
                    createdAt: new Date()
                };

                RabbitMQ.publish('notification', notification);

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
                collectorId: collection.collectorId,
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

}