import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { ICollectionPaymentRepository } from "../interfaces/collectionPayment/ICollectionPaymentRepository";
import collectionClient from "../gRPC/grpcClient";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto"
import amqp from "amqplib";
import { v4 as uuidv4 } from 'uuid';
import { ICollectionPayment } from "../models/CollectionPayment";

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

export class CollectionPaymentService implements ICollectionPaymentService {
    private razorpay: Razorpay;
    private channel!: amqp.Channel;

    constructor(private collectionPaymentRepository: ICollectionPaymentRepository) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string
        });
        this.setupRabbitMQ();
    };

    private async setupRabbitMQ() {
        const connection = await amqp.connect("amqp://localhost");
        this.channel = await connection.createChannel();

        // Declare queues
        await this.channel.assertQueue("paymentInitiatedQueue", { durable: true });
        await this.channel.assertQueue("paymentCompletedQueue", { durable: true });
    }

    // async initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string; amount: number }> {
    //     try {
    //         const response: { success: boolean; message: string, collectionId: string; totalCost: number } = await new Promise((resolve, reject) => {
    //             collectionClient.ValidateCollectionData({ userId, collectionData }, (error: any, response: any) => {
    //                 if (error) {
    //                     return reject(error)
    //                 }

    //                 resolve(response);
    //             });
    //         });

    //         console.log("response from grpc :", response)

    //         if (!response.success) {
    //             throw new Error("Pickup validation failed");
    //         }

    //         const order = await this.razorpay.orders.create({
    //             // amount: response.totalCost * 100,
    //             amount: 50 * 100,
    //             currency: "INR",
    //             receipt: response.collectionId,
    //             payment_capture: true
    //         });

    //         console.log("order :", order);

    //         return { orderId: order.id, amount: order.amount as number };

    //     } catch (error: any) {
    //         console.error('Error while validating collection data:', error.message);
    //         throw error;
    //     }
    // }

    async initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string }> {
        try {

            // Publish PaymentInitiatedEvent
            const paymentInitiatedEvent: PaymentInitiatedEvent = {
                userId,
                // amount: 100, // Replace with actual amount
                collectionData
            };

            this.channel.sendToQueue(
                "paymentInitiatedQueue",
                Buffer.from(JSON.stringify(paymentInitiatedEvent)),
                { persistent: true }
            );

            console.log("Published PaymentInitiatedEvent");

            const order = await this.razorpay.orders.create({
                // amount: response.totalCost * 100,
                amount: 50 * 100,
                currency: "INR",
                receipt: userId,
                payment_capture: true
            });

            console.log("order :", order);

            return { orderId: order.id };

            // return { paymentId };

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
                    advancePaymentMethod:"online",
                    status: "pending",
                    // method: "online",
                    transactionId: razorpay_payment_id, 
                });

                // Publish PaymentCompletedEvent with status
                const paymentCompletedEvent: PaymentCompletedEvent = {
                    userId,
                    paymentId,
                    // status: "success"
                };
    

                this.channel.sendToQueue(
                    "paymentCompletedQueue",
                    Buffer.from(JSON.stringify(paymentCompletedEvent)),
                    { persistent: true }
                );
                console.log("Published PaymentCompletedEvent");
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
}