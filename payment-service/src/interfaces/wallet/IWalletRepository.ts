import mongoose from "mongoose";
import { IWallet, ITransaction } from "../../models/Wallet";
import { IBaseRepository } from "../baseRepository/IBaseRepository";


export interface IWalletRepository extends IBaseRepository<IWallet> {
    updateWallet(userId: string, amount: number, transaction: ITransaction, session?: mongoose.ClientSession): Promise<IWallet | null>
    // updateWallet(userId: string, amount: number, transaction: ITransaction): Promise<IWallet | null>

    getBalance(userId: string): Promise<number>;
}
