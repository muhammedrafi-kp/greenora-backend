import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { ICollectionPaymentRepository } from "../interfaces/collectionPayment/ICollectionPaymentRepository";
import collectionClient from "../gRPC/grpcClient";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto"
import { error } from "node:console";

export class CollectionPaymentService implements ICollectionPaymentService {
    private razorpay: Razorpay;

    constructor(private collectionPaymentRepository: ICollectionPaymentRepository) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string
        });
    };

    async initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string; amount: number }> {
        try {
            const response: { success: boolean; message: string, collectionId: string; totalCost: number } = await new Promise((resolve, reject) => {
                collectionClient.ValidateCollectionData({ userId, collectionData }, (error: any, response: any) => {
                    if (error) {
                        return reject(error)
                    }

                    resolve(response);
                });
            });

            console.log("response from grpc :", response)

            if (!response.success) {
                throw new Error("Pickup validation failed");
            }

            const order = await this.razorpay.orders.create({
                amount: response.totalCost * 100,
                currency: "INR",
                receipt: response.collectionId,
                payment_capture: true
            });

            console.log("order :", order);

            return { orderId: order.id, amount: order.amount as number };

        } catch (error: any) {
            console.error('Error while validating collection data:', error.message);
            throw error;
        }
    }

    async verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean> {
        try {

            const response: { success: boolean; message: string } = await new Promise((resolve, reject) => {
                collectionClient.CreateCollection(userId), (error: any, response: any) => {
                    if (error) {
                        reject(error)
                    }

                    resolve(response);
                }
            });

            console.log("response from grpc :", response)

            console.log(razorpayVerificationData)
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayVerificationData;

            const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const generatedSignature = hmac.digest("hex");

            return generatedSignature === razorpay_signature;

        } catch (error: any) {
            console.error('Error while validating collection data:', error.message);
            throw error;
        }
    }
}