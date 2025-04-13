import { ClientSession } from "mongoose";
import { IWalletRepository } from "../interfaces/wallet/IWalletRepository";
import { Wallet, IWallet, ITransaction } from "../models/Wallet";
import { BaseRepository } from "./baseRepository";


class WalletRepository extends BaseRepository<IWallet> implements IWalletRepository {
    constructor() {
        super(Wallet);
    }

    // async updateWallet(userId: string, amount: number, transaction: ITransaction): Promise<void> {
    // await this.updateOne(
    //     { userId },
    //     {
    //         $inc: { balance: amount },
    //         $push: { transactions: transaction },
    //     }
    // );
    // }

    async updateWallet(userId: string, amount: number, transaction: ITransaction, session?: ClientSession): Promise<void> {
        const options = session ? { session } : {};
        await this.updateOne(
            { userId },
            {
                $inc: { balance: amount },
                $push: { transactions: transaction },
            },
            options
        );
    }

    async getBalance(userId: string): Promise<number> {
        try {
            const wallet = await this.findOne({ userId });

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            return wallet.balance;
        } catch (error: unknown) {
            throw new Error(`Error while getting wallet balance : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

}

export default new WalletRepository();
