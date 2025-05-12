import { IWallet } from "../../models/Wallet";
import mongoose from "mongoose";

export interface IWalletService {
    getWalletData(userId: string): Promise<IWallet>;
    initiateDeposit(userId: string, amount: number): Promise<{amount: number, orderId: string}>;
    verifyDeposit(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void>;
    withdrawMoney(userId: string, amount: number): Promise<void>;
    updateWallet(userId:string,amount:number,session ?:mongoose.ClientSession):Promise<void>;
}
