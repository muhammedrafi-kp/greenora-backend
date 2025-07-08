import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { ICollectionPaymentRepository } from "../interfaces/collectionPayment/ICollectionPaymentRepository";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto"
import { v4 as uuidv4 } from 'uuid';
import { ICollectionPayment } from "../models/CollectionPayment";
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import { ITransaction } from "../models/Wallet";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { ClientSession } from "mongoose";


export class CollectionPaymentService implements ICollectionPaymentService {
    private razorpay: Razorpay;

    constructor(
        private _collectionPaymentRepository: ICollectionPaymentRepository,
        private _walletRepository: IWalletRepository
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




    async payWithWallet(userId: string, amount: number, serviceType: string): Promise<{ transactionId: string, paymentId: string }> {
        try {

            const walletBalance = await this._walletRepository.getBalance(userId);

            console.log("walletBalance :", walletBalance);  

            if (walletBalance < amount) {
                const error: any = new Error(MESSAGES.INSUFFICIENT_WALLET_BALANCE);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const transaction: ITransaction = {
                type: "debit",
                amount: amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: serviceType
            }

            const updatedWallet = await this._walletRepository.updateWallet(userId, amount * (-1), transaction);

            const transactionId = updatedWallet?.transactions[updatedWallet?.transactions.length - 1]._id;

            const paymentId = uuidv4().replace(/-/g, '').substring(0, 16);

            if (!updatedWallet || !transactionId) {
                const error: any = new Error(MESSAGES.WALLET_UPDATE_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            return { transactionId, paymentId };

        } catch (error: any) {
            console.error('Error while initiating payment:', error.message);
            throw error;
        }
    }

    async getPaymentData(paymentId: string): Promise<ICollectionPayment | null> {
        try {
            return await this._collectionPaymentRepository.findOne({ paymentId });
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


            return await this._collectionPaymentRepository.updateOne({ paymentId }, paymentData, options);
        } catch (error: any) {
            console.error("Error while updating payment details :", error.message);
            throw error;
        }
    }


}