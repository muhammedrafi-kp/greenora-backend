import { IWalletService } from "../interfaces/wallet/IWalletService";
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import { IWallet } from "../models/Wallet";
import { ITransaction } from "../models/Transaction";
import Razorpay from "razorpay";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import axios from "axios";
import { createHmac } from "node:crypto"
import mongoose, { ClientSession } from "mongoose";
import { ITransactionRepository } from "../interfaces/wallet/ITransactionRepository";
import { CreateTransactionDto } from "../dtos/internal/transaction.dto";
import { TransactionDto } from "../dtos/response/transaction.dto"

export class WalletService implements IWalletService {

    private razorpay: Razorpay;

    constructor(
        private _walletRepository: IWalletRepository,
        private _transactionRepository: ITransactionRepository
    ) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string
        });
    }

    async getWalletData(userId: string): Promise<IWallet> {
        try {
            console.log("userId:", userId);

            const wallet = await this._walletRepository.findOne({ userId });

            if (!wallet) {
                const error: any = new Error(MESSAGES.WALLET_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
            return wallet;
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            throw error;
        }
    }

    async getWalletWithTransactions(userId: string, options: { type?: string; startDate?: string; endDate?: string; page: number; limit: number; }): Promise<{ balance: number; transactions: TransactionDto[]; }> {
        try {
            console.log("userId:", userId);

            const wallet = await this._walletRepository.findOne({ userId });

            if (!wallet) {
                const error: any = new Error(MESSAGES.WALLET_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const filter: any = { walletId: wallet._id };

            if (options.type) filter.type = options.type;
            if (options.startDate || options.endDate) {
                filter.timestamp = {};
                if (options.startDate) filter.timestamp.$gte = new Date(options.startDate);
                if (options.endDate) filter.timestamp.$lte = new Date(options.endDate);
            }
            const sort: Record<string, 1 | -1> = {};
            sort.timestamp = -1;
            const skip = (options.page - 1) * options.limit;

            const transactions = await this._transactionRepository.find(filter, {}, sort, skip, options.limit)

            return { balance: wallet.balance, transactions: TransactionDto.fromList(transactions) };
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            throw error;
        }
    }

    async initiateDeposit(userId: string, amount: number): Promise<{ amount: number, orderId: string }> {
        try {

            const existingWallet = await this._walletRepository.findOne({ userId });

            if (!existingWallet) {
                await this._walletRepository.create({ userId });
            }

            const order = await this.razorpay.orders.create({
                amount: amount * 100,
                currency: "INR",
                receipt: `order_rcptid_${Date.now()}`,
                payment_capture: true,
            });

            console.log("order:", order);
            return { amount: order.amount as number, orderId: order.id as string };
        } catch (error) {
            console.error("Error during initiating deposit:", error);
            throw error;
        }
    }

    async verifyDeposit(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<TransactionDto> {
        const session = await this._walletRepository.startSession();
        session.startTransaction();

        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayVerificationData;

            const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string);
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const calculatedSignature = hmac.digest("hex");

            if (calculatedSignature !== razorpay_signature) {
                const error: any = new Error(MESSAGES.INVALID_SIGNATURE);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const response = await axios.get(`https://api.razorpay.com/v1/payments/${razorpayVerificationData.razorpay_payment_id}`, {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID as string,
                    password: process.env.RAZORPAY_KEY_SECRET as string
                }
            });

            console.log("resposne:", response.status);

            if (response.status !== 200 || !response.data || typeof response.data.amount !== "number") {
                const error: any = new Error(MESSAGES.PAYMENT_VERIFICATION_FAILED);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const amount = response.data.amount / 100;

            console.log("userId :", userId)

            const wallet = await this._walletRepository.updateOne(
                { userId },
                { $inc: { balance: amount } },
                { session }
            );

            console.log("wallet :", wallet);

            if (!wallet) {
                const error: any = new Error(MESSAGES.WALLET_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            };

            const transactionData: CreateTransactionDto = {
                walletId: wallet._id,
                type: "credit",
                amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: "deposit"
            };

            const transaction = await this._transactionRepository.create(transactionData, { session });

            console.log("transaction :", transaction);

            await session.commitTransaction();
            return TransactionDto.from(transaction);

        } catch (error) {
            await session.abortTransaction();
            console.error("Error during verifying deposit:", error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async withdrawMoney(userId: string, amount: number): Promise<TransactionDto> {
        const session = await this._walletRepository.startSession();
        session.startTransaction();

        try {

            const wallet = await this._walletRepository.updateOne(
                { userId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true, session }
            );

            if (!wallet) {
                const existingWallet = await this._walletRepository.findOne({ userId }, { session });
                if (!existingWallet) {
                    const error: any = new Error(MESSAGES.WALLET_NOT_FOUND);
                    error.status = HTTP_STATUS.NOT_FOUND;
                    throw error;
                }

                const error: any = new Error(MESSAGES.INSUFFICIENT_BALANCE);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const transactionData: CreateTransactionDto = {
                walletId: wallet._id,
                type: "debit",
                amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: "withdraw"
            };

            const transaction = await this._transactionRepository.create(transactionData, { session })

            console.log("transaction :", transaction);

            await session.commitTransaction()
            return TransactionDto.from(transaction);

        } catch (error) {
            await session.abortTransaction()
            console.error("Error during withdrawing money:", error);
            throw error;
        } finally {
            session.endSession();
        }
    }

}

