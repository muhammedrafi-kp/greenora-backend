import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto"
import { v4 as uuidv4 } from 'uuid';
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import { ITransactionRepository } from "../interfaces/wallet/ITransactionRepository";
import { CreateTransactionDto } from "../dtos/internal/transaction.dto"

import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

export class CollectionPaymentService implements ICollectionPaymentService {
    private razorpay: Razorpay;

    constructor(
        private _walletRepository: IWalletRepository,
        private _transactionRepository: ITransactionRepository
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
        const session = await this._walletRepository.startSession()
        session.startTransaction();

        try {

            const wallet = await this._walletRepository.updateOne(
                { userId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true, session }
            );

            if (!wallet) {
                const error: any = new Error(MESSAGES.INSUFFICIENT_BALANCE);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const transactionData: CreateTransactionDto = {
                walletId: wallet._id,
                type: "debit",
                amount: amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: serviceType
            }

            const transaction = await this._transactionRepository.create(transactionData, { session })

            console.log("transaction :", transaction);

            const paymentId = uuidv4().replace(/-/g, '').substring(0, 16);

            await session.commitTransaction();

            return { transactionId: transaction._id.toString(), paymentId };

        } catch (error: any) {
            await session.abortTransaction()
            console.error('Error while wallet payment:', error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async refundCollectionAdvance(userId: string, amount: number): Promise<void> {
        const session = await this._walletRepository.startSession();
        session.startTransaction();

        try {

            const wallet = await this._walletRepository.updateOne(
                { userId },
                { $inc: { balance: amount } },
                { session }
            );

            if (!wallet) {
                // const error: any = new Error(MESSAGES.WALLET_NOT_FOUND);
                // error.status = HTTP_STATUS.NOT_FOUND;
                // throw error;
                return;
            };

            const transactionData: CreateTransactionDto = {
                walletId: wallet._id,
                type: "refund",
                amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: "Collection advance refund"
            };

            const transaction = await this._transactionRepository.create(transactionData, { session })

            console.log("transaction :", transaction);

            await session.commitTransaction();

        } catch (error) {
            await session.abortTransaction()
            console.error("Error during withdrawing money:", error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}