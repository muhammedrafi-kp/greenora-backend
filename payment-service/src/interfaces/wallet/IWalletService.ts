import { WalletDto } from "../../dtos/response/wallet.dto";
import { TransactionDto } from "../../dtos/response/transaction.dto";

export interface IWalletService {
    createWallet(userId: string): Promise<WalletDto>
    getWallet(userId: string): Promise<WalletDto>;
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
}
