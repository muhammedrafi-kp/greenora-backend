import RabbitMQ from "../utils/rabbitmq";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import collectionPaymentRepository from "../repositories/collectionPaymentRepository";
import walletRepository from "../repositories/walletRepository";
import { IWalletService } from "../interfaces/wallet/IWalletService";
import { WalletService } from "../services/walletService";
import mongoose from "mongoose";

// Events
interface PaymentInitiatedEvent {
    // paymentId: string;
    userId: string;
    collectionData: object;
}

interface CollectionCreatedEvent {
    paymentId: string;
    collectionId: string;
    userId: string;
}

interface PaymentCompletedEvent {
    userId: string;
    paymentId: string; // Add paymentId for reference
    // status: "success" | "failed"; // Add status
}

interface FinalPaymentEvent {
    paymentId: string;
    status: "success" | "failed";
    method: "online" | "cash";
    amount: number;
    paymentDate: Date;
}

const collectionPaymentService: ICollectionPaymentService = new CollectionPaymentService(collectionPaymentRepository, walletRepository)
const walletservice: IWalletService = new WalletService(walletRepository);

export default class PaymentConsumer {
    static async initialize() {
        await RabbitMQ.connect();


        RabbitMQ.consume("finalPayment-payment", async (msg) => {
            console.log("Received FinalPaymentEvent:", msg.content.toString());

            try {
                const event: FinalPaymentEvent = JSON.parse(msg.content.toString());

                if (!event.paymentId || !event.status || !event.method || !event.amount || !event.paymentDate) {
                    console.error("Invalid message format:", event);
                    RabbitMQ.nack(msg, false, false);
                    return;
                }

                console.log("Received FinalPaymentEvent:", event);

                const updatedPaymentData = await collectionPaymentService.updatePaymentData(event.paymentId, {
                    status: event.status,
                    method: event.method,
                    amount: event.amount,
                    paidAt: event.paymentDate,
                });
                console.log("Updated Payment Data:", updatedPaymentData);

            } catch (error) {
                console.error("❌ Error processing message:", error);

                // ✅ Handle JSON parsing errors separately
                if (error instanceof SyntaxError) {
                    console.error("Invalid JSON format. Discarding message.");
                    RabbitMQ.nack(msg, false, false); // ❌ Reject (do not requeue)
                } else {
                    RabbitMQ.nack(msg, false, true); // ❌ Requeue only for non-parsing errors
                }
            }
        });


        // RabbitMQ.consume("pickup.cancelled", async (msg) => {
        //     console.log("Received pickup.cancelled:", msg.content.toString());

        //     try {
        //         const message = JSON.parse(msg.content.toString());

        //         if (!message.paymentId || !message.userId) {
        //             console.warn("Invalid message: Missing paymentId or userId");
        //             return;
        //         }

        //         // Perform the refund operation
        //         await collectionPaymentService.updatePaymentData(message.paymentId, { advancePaymentStatus: "refunded" });
        //         await walletservice.updateWallet(message.userId,50);

        //         console.log(`Refund processed for Payment ID: ${message.paymentId}`);

        //     } catch (error) {
        //         console.error("Error processing refund, triggering rollback:", error);
        //         const message = JSON.parse(msg.content.toString());

        //         try {
        //             // Publish rollback event
        //             await RabbitMQ.publish("rollback.cancellation", {
        //                 collectionId: message.collectionId,
        //                 paymentId: message.paymentId,
        //             });
        //         } catch (publishError) {
        //             console.error("Failed to publish rollback event:", publishError);
        //         }
        //     }
        // });


        RabbitMQ.consume("collection-cancelled-payment", async (msg) => {
            console.log("Received pickup.cancelled:", msg.content.toString());
        
            // Start MongoDB Transaction
            const session = await mongoose.startSession();
            session.startTransaction();
        
            try {
                const message = JSON.parse(msg.content.toString());
        
                if (!message.paymentId || !message.userId) {
                    console.warn("Invalid message: Missing paymentId or userId");
                    await session.abortTransaction();
                    session.endSession();
                    return;
                }
        
                // Perform refund operation with transaction
                await collectionPaymentService.updatePaymentData(
                    message.paymentId,
                    { advancePaymentStatus: "refunded" },
                    session
                );
        
                await walletservice.updateWallet(message.userId,50,session);
        
                // Commit transaction if both operations succeed
                await session.commitTransaction();
                session.endSession();
                console.log(`Refund processed for Payment ID: ${message.paymentId}`);
        
            } catch (error) {
                console.error("Error processing refund, triggering rollback:", error);
        
                try {
                    // Rollback transaction if an error occurs
                    await session.abortTransaction();
                    session.endSession();
        
                    const message = JSON.parse(msg.content.toString());
        
                    // Publish rollback event to handle inconsistency
                    await RabbitMQ.publish("rollback.cancellation", {
                        collectionId: message.collectionId,
                        paymentId: message.paymentId,
                    });
        
                } catch (publishError) {
                    console.error("Failed to publish rollback event:", publishError);
                }

                throw error; 
            }
        });
        

    }

}