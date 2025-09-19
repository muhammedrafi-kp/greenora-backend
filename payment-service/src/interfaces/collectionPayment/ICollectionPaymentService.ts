
export interface ICollectionPaymentService {
    createRazorpayOrder(amount: number): Promise<{ orderId: string }>;
    verifyPayment(razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<{ isValidPayment: boolean, paymentId?: string }>;
    payWithWallet(userId: string, amount: number, serviceType: string): Promise<{ transactionId: string, paymentId: string }>;  
}
