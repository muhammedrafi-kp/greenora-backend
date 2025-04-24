import { ICollectionPayment } from "../../models/CollectionPayment";
import { ICollection } from "../external/external";
import mongoose from "mongoose";

export interface ICollectionPaymentService {
    // initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string; amount: number }>;
    processRazorpayPayment(userId: string, collectionData: Partial<ICollection>): Promise<{ orderId: string }>
    processWalletPayment(userId: string, collectionData: Partial<ICollection>): Promise<void>;
    // verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean>;
    verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean>;
    getPaymentData(paymentId: string): Promise<ICollectionPayment | null>;
    updatePaymentData(paymentId: string, paymentData: Partial<ICollectionPayment>, session?: mongoose.ClientSession): Promise<ICollectionPayment | null>;
    requestPayment(userId: string, paymentId: string, amount: number): Promise<void>;
}
