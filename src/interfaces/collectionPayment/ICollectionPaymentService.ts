import { ICollectionPayment } from "../../models/CollectionPayment";
import { ICollection } from "../external/external";
import mongoose from "mongoose";

export interface ICollectionPaymentService {
    createRazorpayOrder(amount: number): Promise<{ orderId: string }>;
    verifyPayment(razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<{ isValidPayment: boolean, paymentId?: string }>;
   
    processWalletPayment(userId: string, collectionData: Partial<ICollection>): Promise<void>;  
    getPaymentData(paymentId: string): Promise<ICollectionPayment | null>;
    updatePaymentData(paymentId: string, paymentData: Partial<ICollectionPayment>, session?: mongoose.ClientSession): Promise<ICollectionPayment | null>;
}
