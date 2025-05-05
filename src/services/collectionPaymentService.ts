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

    async createRazorpayOrder(amount: number): Promise<{ orderId: string }> {
        try {

            const order = await this.razorpay.orders.create({
                amount: amount * 100,
                currency: "INR",
                payment_capture: true
            });

            console.log("order :", order);

            return { orderId: order.id };
        } catch (error: any) {
            console.error('Error while creating order:', error.message);
            throw error;
        }
    }

    async verifyPayment(razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<{ isValidPayment: boolean, paymentId?: string }> {
        try {

            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayVerificationData;

            const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const generatedSignature = hmac.digest("hex");

            const isValidPayment = generatedSignature === razorpay_signature;

            const paymentId = uuidv4().replace(/-/g, '').substring(0, 16);

            return { isValidPayment, paymentId };

        } catch (error: any) {
            console.error('Error while verifying payment   ', error.message);
            throw error;
        }
    }


























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


}