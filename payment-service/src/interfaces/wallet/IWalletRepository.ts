import mongoose from "mongoose";
import { IWallet } from "../../models/Wallet";
import {ITransaction} from "../../models/Transaction"
import { IBaseRepository } from "../baseRepository/IBaseRepository";


export interface IWalletRepository extends IBaseRepository<IWallet> {
    updateWallet(userId: string, amount: number, transaction: ITransaction, session?: mongoose.ClientSession): Promise<IWallet | null>
    getBalance(userId: string): Promise<number>;
}
