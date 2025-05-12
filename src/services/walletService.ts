import { IWalletService } from "../interfaces/wallet/IWalletService";
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import amqp from "amqplib";
import { IWallet, ITransaction } from "../models/Wallet";
import Razorpay from "razorpay";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import axios from "axios";
import { createHmac } from "node:crypto"
import { ClientSession } from "mongoose";


export class WalletService implements IWalletService {

    private channel!: amqp.Channel;
    private razorpay: Razorpay;

    constructor(private walletRepository: IWalletRepository) {
        this.setupRabbitMQ();
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string
        });
    }

    private async setupRabbitMQ() {
        const connection = await amqp.connect("amqp://localhost");
        this.channel = await connection.createChannel();
        // Declare queues
        await this.channel.assertQueue("userCreatedQueue", { durable: true });

        console.log("Waiting for messages in walletservice...");


        this.channel.consume("userCreatedQueue", async (message) => {
            try {
                if (message) {
                    console.log("Received message in wallet service:", message.content.toString());
                    const event: { userId: string } = JSON.parse(message.content.toString());
                    console.log("userId:", event.userId);
                    await this.walletRepository.create({ userId: event.userId });
                    this.channel.ack(message);
                }
            } catch (error) {
                console.error("Error processing message:", error);
                this.channel.reject(message as amqp.Message, false); // Reject the message without requeuing
            }
        });

    }

    async getWalletData(userId: string): Promise<IWallet> {
        try {
            console.log("userId:", userId);

            const wallet = await this.walletRepository.findOne({ userId });
            
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

    async initiateDeposit(userId: string, amount: number): Promise<{ amount: number, orderId: string }> {
        try {
            const order = await this.razorpay.orders.create({
                amount: amount * 100,
                currency: "INR",
                receipt: "order_rcptid_11",
                payment_capture: true,
            });
            console.log("order:", order);
            return { amount: order.amount as number, orderId: order.id as string };
        } catch (error) {
            console.error("Error during initiating deposit:", error);
            throw error;
        }
    }

    async verifyDeposit(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void> {
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
            const resposne = await axios.get(`https://api.razorpay.com/v1/payments/${razorpayVerificationData.razorpay_payment_id}`, {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID as string,
                    password: process.env.RAZORPAY_KEY_SECRET as string
                }
            });
            console.log("resposne:", resposne.status);
            if (resposne.status === 200) {
                const amount = resposne.data.amount / 100;

                const transaction: ITransaction = {
                    type: "credit",
                    amount: amount,
                    timestamp: new Date(),
                    status: "completed",
                    serviceType: "deposit"
                }

                await this.walletRepository.updateWallet(userId, amount, transaction);
            }
            // await this.walletRepository.withdrawMoney(userId, amount);
        } catch (error) {
            console.error("Error during withdrawing money:", error);
            throw error;
        }
    }

    async withdrawMoney(userId: string, amount: number): Promise<void> {
        try {

            const transaction: ITransaction = {
                type: "debit",
                amount: amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: "withdraw"
            }

            await this.walletRepository.updateWallet(userId, amount * (-1), transaction);
        } catch (error) {
            console.error("Error during withdrawing money:", error);
            throw error;
        }
    }

    async updateWallet(userId: string, amount: number, session?: ClientSession): Promise<void> {
        try {

            const transaction: ITransaction = {
                type: "credit",
                amount: amount,
                timestamp: new Date(),
                status: "completed",
                serviceType: "refund"
            }

            await this.walletRepository.updateWallet(userId, amount, transaction, session);

        } catch (error) {
            console.error("Error during withdrawing money:", error);
            throw error;
        }
    }
}

