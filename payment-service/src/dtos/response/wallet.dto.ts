import { IWallet } from "../../models/Wallet";

export class WalletDto {
    public readonly _id: string;
    public readonly userId: string;
    public readonly balance: number;
    public readonly status: "active" | "suspended" | "closed";
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;

    constructor(wallet: IWallet) {
        this._id = wallet._id.toString();
        this.userId = wallet.userId;
        this.balance = wallet.balance;
        this.status = wallet.status;
    }

    public static from(wallet: IWallet): WalletDto {
        return new WalletDto(wallet);
    }

    public static fromList(wallets: IWallet[]): WalletDto[] {
        return wallets.map(wallet => new WalletDto(wallet));
    }
}
