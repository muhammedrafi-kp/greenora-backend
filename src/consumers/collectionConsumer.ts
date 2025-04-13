import { ICollection } from "../models/Collection";
import RabbitMQ from "../utils/rabbitmq";
import { CollectionService } from "../services/collectionService";
import collectionRepository from "../repositories/collectionRepository";
import categoryRepository from "../repositories/categoryRepository";
import redisRepository from "../repositories/redisRepository";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";

const collectionService: ICollectionservice = new CollectionService(collectionRepository, categoryRepository, redisRepository);
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

interface ScheduleCollectionEvent {
    collectionId: string;
    userId: string;
    serviceAreaId: string;
    preferredDate: string;
}

export default class CollectionConsumer {
    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("paymentInitiatedQueue", async (msg) => {
            console.log("Received PaymentInitiatedEvent:", msg.content.toString());

            try {
                const message: PaymentInitiatedEvent = JSON.parse(msg.content.toString());

                const collectionId = await collectionService.validateCollection(
                    message.userId,
                    message.collectionData
                );

                // Publish CollectionCreatedEvent
                const collectionStoredEvent: collectionStoredEvent = {
                    paymentId: message.paymentId,
                    collectionId,
                    userId: message.userId
                };

                await RabbitMQ.publish("collectionStoredQueue", collectionStoredEvent);
            } catch (error) {
                console.error("Error processing PaymentInitiatedEvent:", error);
                RabbitMQ.nack(msg, false, false); // Move to DLQ or discard
            }
        });


        await RabbitMQ.consume("paymentCompletedQueue", async (msg) => {
            console.log("Received PaymentCompletedEvent:", msg.content.toString());

            try {
                const message: PaymentCompletedEvent = JSON.parse(msg.content.toString());

                // Create collection only if payment is successful
                const collection = await collectionService.createCollection(message.userId, message.paymentId);

                // await RabbitMQ.publish("scheduleCollection", {
                //     collectionId: collection.collectionId,
                //     userId: collection.userId,
                //     serviceAreaId: collection.serviceAreaId,
                //     preferredDate: collection.preferredDate
                // });

            } catch (error) {
                console.error("Error processing PaymentCompletedEvent:", error);
                RabbitMQ.nack(msg, false, false); // Move to DLQ or discard
            }
        });


        RabbitMQ.consume("rollback.cancellation", async (message) => {
            try {
                console.log("Rollback triggered for Collection ID:", message.collectionId);
                // await Collection.updateOne(
                //     { collectionId: message.collectionId },
                //     { status: "scheduled" }
                // );
            } catch (error) {
                console.error("Error during rollback", error);
            }
        });



        RabbitMQ.consume("scheduleCollection", async (msg) => {
            console.log("Received ScheduleTask:", msg.content.toString());

            try {
                const message: ScheduleCollectionEvent = JSON.parse(msg.content.toString());

                console.log("message :", message);

                await collectionService.scheduleCollection(message.collectionId,message.userId, message.serviceAreaId, message.preferredDate);

            } catch (error) {
                console.error("Error processing ScheduleTask:", error);
                // RabbitMQ.nack(msg, false, false);
            }
        });

    }
}
