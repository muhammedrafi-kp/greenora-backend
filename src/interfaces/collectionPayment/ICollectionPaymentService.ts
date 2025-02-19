
export interface ICollectionPaymentService {
    initiatePayment(userId: string, collectionData: object): Promise<{ orderId: string; amount: number }>;
    verifyPayment(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<boolean>;
}
