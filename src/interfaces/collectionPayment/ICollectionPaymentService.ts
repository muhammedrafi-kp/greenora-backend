import { ICollectionPayment } from "../../models/CollectionPayment";

export interface ICollectionPaymentService {
    // initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string; amount: number }>;
    initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string }>
    // verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean>;
    verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean>;
    getPaymentData(paymentId: string): Promise<ICollectionPayment | null>;
}
