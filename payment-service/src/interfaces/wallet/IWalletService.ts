import { IWallet } from "../../models/Wallet";
import { TransactionDto } from "../../dtos/response/transaction.dto";

export interface IWalletService {
    getWalletData(userId: string): Promise<IWallet>;
    getWalletWithTransactions(userId: string, options: {
        type?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
    }): Promise<{ balance: number, transactions: TransactionDto[] }>
    initiateDeposit(userId: string, amount: number): Promise<{ amount: number, orderId: string }>;
    verifyDeposit(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<TransactionDto>;
    withdrawMoney(userId: string, amount: number): Promise<TransactionDto>;
    // updateWallet(userId:string,amount:number,session ?:mongoose.ClientSession):Promise<void>;
}
