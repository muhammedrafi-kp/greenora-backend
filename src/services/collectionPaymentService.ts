import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { ICollectionPaymentRepository } from "../interfaces/collectionPayment/ICollectionPaymentRepository";
import collectionClient from "../gRPC/grpcClient";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto"
import { v4 as uuidv4 } from 'uuid';
import { ICollectionPayment } from "../models/CollectionPayment";
import RabbitMQ from "../utils/rabbitmq";
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import { ITransaction } from "../models/Wallet";
import { ICollection, INotification } from "../interfaces/external/external";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { ClientSession } from "mongoose";
// Events
interface PaymentInitiatedEvent {
    // paymentId: string;
    userId: string;
    collectionData: object;
}


interface PaymentCompletedEvent {
    userId: string;
    paymentId: string; // Add paymentId for reference
    // status: "success" | "failed"; // Add status
}




export class CollectionPaymentService implements ICollectionPaymentService {
    private razorpay: Razorpay;

    constructor(
        private collectionPaymentRepository: ICollectionPaymentRepository,
        private walletRepository: IWalletRepository
    ) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string
        });
    };


    async processWalletPayment(userId: string, collectionData: Partial<ICollection>): Promise<void> {
        try {

            const walletBalance = await this.walletRepository.getBalance(userId);

            if (!collectionData.estimatedCost) {
                const error: any = new Error(MESSAGES.COLLECTION_DATA_REQUIRED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            if (walletBalance < 50) {
                const error: any = new Error(MESSAGES.INSUFFICIENT_WALLET_BALANCE);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            // Publish PaymentInitiatedEvent
            const paymentInitiatedEvent: PaymentInitiatedEvent = {
                userId,
                collectionData
            };

            await RabbitMQ.publish("paymentInitiatedQueue", paymentInitiatedEvent);

            const transaction: ITransaction = {
                type: "debit",
                amount: 50,
                timestamp: new Date(),
                status: "completed",
                serviceType: "collection advance"
            }

            await this.walletRepository.updateWallet(userId, 50 * (-1), transaction);


            const paymentId = uuidv4();

            await this.collectionPaymentRepository.create({
                paymentId,
                userId,
                advanceAmount: 50,
                advancePaymentStatus: "success",
                advancePaymentMethod: "wallet",
                status: "pending",
            });


            const paymentCompletedEvent: PaymentCompletedEvent = {
                userId,
                paymentId,
                // status: "success"
            };

            await RabbitMQ.publish("paymentCompletedQueue", paymentCompletedEvent)

        } catch (error: any) {
            console.error('Error while initiating payment:', error.message);
            throw error;
        }
    }


    async processRazorpayPayment(userId: string, collectionData: Partial<ICollection>): Promise<{ orderId: string }> {
        try {

            // Publish PaymentInitiatedEvent
            const paymentInitiatedEvent: PaymentInitiatedEvent = {
                userId,
                // amount: 100, // Replace with actual amount
                collectionData
            };

            await RabbitMQ.publish("paymentInitiatedQueue", paymentInitiatedEvent)

            const order = await this.razorpay.orders.create({
                // amount: response.totalCost * 100,
                amount: 50 * 100,
                currency: "INR",
                receipt: userId,
                payment_capture: true
            });

            console.log("order :", order);

            return { orderId: order.id };

        } catch (error: any) {
            console.error('Error while initiating payment:', error.message);
            throw error;
        }
    }

    async verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean> {
        try {

            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayVerificationData;

            const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const generatedSignature = hmac.digest("hex");

            const isPaymentValid = generatedSignature === razorpay_signature;

            if (isPaymentValid) {
                const paymentId = uuidv4();

                await this.collectionPaymentRepository.create({
                    paymentId,
                    userId,
                    advanceAmount: 50,
                    advancePaymentStatus: "success",
                    advancePaymentMethod: "online",
                    status: "pending",
                    // method: "online",
                    // transactionId: razorpay_payment_id,
                });

                // Publish PaymentCompletedEvent with status
                const paymentCompletedEvent: PaymentCompletedEvent = {
                    userId,
                    paymentId,
                    // status: "success"
                };

                await RabbitMQ.publish("paymentCompletedQueue", paymentCompletedEvent)
            }

            return isPaymentValid;

        } catch (error: any) {
            console.error('Error while verifying payment   ', error.message);
            throw error;
        }
    }


    // async verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean> {
    //     try {

    //         console.log("verifyPayment in service")

    //         const response: { success: boolean; message: string } = await new Promise((resolve, reject) => {
    //             collectionClient.CreateCollection({ userId }, (error: any, response: any) => {
    //                 if (error) {
    //                     return reject(error);
    //                 }
    //                 resolve(response);
    //             });
    //         });

    //         console.log("response from grpc :", response)

    //         console.log(razorpayVerificationData)
    //         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayVerificationData;

    //         const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
    //         hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    //         const generatedSignature = hmac.digest("hex");

    //         return generatedSignature === razorpay_signature;

    //     } catch (error: any) {
    //         console.error('Error while verifying payment   ', error.message);
    //         throw error;
    //     }
    // }

    async getPaymentData(paymentId: string): Promise<ICollectionPayment | null> {
        try {
            return await this.collectionPaymentRepository.findOne({ paymentId });
        } catch (error: any) {
            console.error("Error while fetching payment details :", error.message);
            throw error;
        }
    }


    async updatePaymentData(paymentId: string, paymentData: Partial<ICollectionPayment>, session?: ClientSession): Promise<ICollectionPayment | null> {
        try {
            const options = session ? { session } : {};

            console.log("paymentId:", paymentId)
            console.log("paymentId:", paymentData)


            return await this.collectionPaymentRepository.updateOne({ paymentId }, paymentData, options);
        } catch (error: any) {
            console.error("Error while updating payment details :", error.message);
            throw error;
        }
    }

    async requestPayment(userId: string, paymentId: string, amount: number): Promise<void> {
        try {
            const paymentData = await this.collectionPaymentRepository.findOne({ paymentId });
            console.log("paymentData :", paymentData);

            if (!paymentData) {
                const error: any = new Error(MESSAGES.PAYMENT_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const order = await this.razorpay.orders.create({
                amount: (amount - paymentData.advanceAmount) * 100,
                currency: "INR",
                receipt: paymentId,
                payment_capture: true
            });

            await this.updatePaymentData(paymentId, { amount: amount, orderId: order.id });

            const queue = "notification";

            const notification: INotification = {
                userId: userId,
                title: "Payment Request for Waste Pickup",
                message: `The waste pickup is ready and a payment request has been generated. Please complete the payment to proceed.`,
                url: `/account/collections`,
                createdAt: new Date()
            };

            await RabbitMQ.publish(queue, notification);

        } catch (error: any) {
            console.error("Error while requesting payment :", error.message);
            throw error;
        }
    }
}