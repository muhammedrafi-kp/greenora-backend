import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { ICollection } from "../models/Collection";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { v4 as uuidv4 } from 'uuid';
import { userClient, collectorClient } from "../gRPC/client/userClient";
import mongoose from "mongoose";
import amqp from "amqplib";

// Events
interface PaymentInitiatedEvent {
    paymentId: string;
    userId: string;
    amount: number;
    collectionData: ICollection;
}

interface collectionStoredEvent {
    paymentId: string;
    collectionId: string;
    userId: string;
}

interface PaymentCompletedEvent {
    userId: string;
    paymentId: string; // Add paymentId for reference
    // status: "success" | "failed"; // Add status
}

interface collectionCreated {

}

interface IUser {
    userId: string;
    name: string;
    email: string;
    phone: string;
}

export interface ICollector {
    id: string;
    collectorId: string;
    name: string;
    email: string;
    phone: string;
    availabilityStatus: string;
    currentTasks: number;
    maxCapacity: number;
}



export class CollectionService implements ICollectionservice {
    private channel!: amqp.Channel;
    constructor(
        private collectionRepository: ICollectionRepository,
        private categoryRepository: ICategoryRepository,
        private redisRepository: IRedisRepository

    ) {
        this.setupRabbitMQ();
    };

    private async setupRabbitMQ() {
        const connection = await amqp.connect("amqp://localhost");
        this.channel = await connection.createChannel();

        // Declare queues
        await this.channel.assertQueue("paymentInitiatedQueue", { durable: true });
        await this.channel.assertQueue("paymentCompletedQueue", { durable: true });
        await this.channel.assertQueue("collectionCreatedQueue", { durable: true });
        console.log("Waiting for messages...");

        // Consume PaymentInitiatedEvent
        this.channel.consume("paymentInitiatedQueue", async (message) => {
            if (message) {
                try {
                    const event: PaymentInitiatedEvent = JSON.parse(message.content.toString());
                    console.log("Received PaymentInitiatedEvent:", event);

                    // Validate and create collection
                    const collectionId = await this.validateCollection(event.userId, event.collectionData);

                    // Publish CollectionCreatedEvent
                    const collectionStoredEvent: collectionStoredEvent = {
                        paymentId: event.paymentId,
                        collectionId,
                        userId: event.userId
                    };

                    this.channel.sendToQueue(
                        "collectionStoredQueue",
                        Buffer.from(JSON.stringify(collectionStoredEvent)),
                        { persistent: true }
                    );


                    console.log("Published CollectionCreatedEvent");

                    this.channel.ack(message);
                } catch (error) {
                    console.error("Error processing PaymentInitiatedEvent:", error);
                    this.channel.nack(message, false, false); // Do not requeue the message
                }
            }
        });

        // Consume PaymentCompletedEvent
        this.channel.consume("paymentCompletedQueue", async (message) => {
            if (message) {
                try {
                    const event: PaymentCompletedEvent = JSON.parse(message.content.toString());
                    console.log("Received PaymentCompletedEvent:", event);


                    // Create collection only if payment is successful
                    await this.createCollection(event.userId, event.paymentId);
                    // Clean up Redis data if payment fails
                    this.channel.ack(message);
                } catch (error) {
                    console.error("Error processing PaymentCompletedEvent:", error);
                    this.channel.nack(message, false, false); // Do not requeue the message
                }
            }
        });
    }



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

    async getCollectionHistories(): Promise<Partial<ICollection>[]> {
        try {
            const collections = await this.collectionRepository.findAll({});
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


            console.log("enrichedCollections:", enrichedCollections);


            return enrichedCollections;
        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }

    async getAvailableCollectors(serviceAreaId: string): Promise<{ success: true, collectors: object[] }> {
        try {
            const response: { success: boolean; collectors: object[] } = await new Promise((resolve, reject) => {
                collectorClient.GetAvailableCollectors({ serviceAreaId }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }

                    resolve(response);
                });
            });
            console.log("response in collection controller :", response);
            if (!response.success) {
                throw new Error("getting collectors failed!");
            }

            return {
                success: true,
                collectors: response.collectors
            }
        } catch (error) {
            console.error('Error while fetching available collectors:', error);
            throw error;
        }
    }

    // async processPendingRequests(): Promise<ICollection[]> {

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
                const connection = await amqp.connect("amqp://localhost");
                const channel = await connection.createChannel();
                const queue = "notifications";

                // Ensure the queue exists
                await channel.assertQueue(queue, { durable: true });

                const notificationMessage = JSON.stringify({
                    userId: request.userId,
                    message: `Your pickup has been scheduled with collector ${assignedCollector.name}.`
                });

                channel.sendToQueue(queue, Buffer.from(notificationMessage), { persistent: true });
                console.log("Notification message published to queue:", notificationMessage);

                // Close the connection
                await channel.close();
                await connection.close();
            } else {
                await this.collectionRepository.updateById(request._id as mongoose.Types.ObjectId, { status: "queued" });
            }
        } catch (error) {
            console.error('Error while assigning available collectors:', error);
            throw error;
        }
    }

    async getAssignedCollections(collectorId: string): Promise<Partial<ICollection>[]> {
        try {
            const filter = { collectorId };

            // return await this.collectionRepository.findAll(filter);

            const collections = await this.collectionRepository.findAll(filter);
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

}