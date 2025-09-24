import { ITransaction } from "../../models/Transaction";

export class TransactionDto {
    public readonly _id: string;
    public readonly walletId: string;
    public readonly type: "debit" | "credit" | "refund";
    public readonly amount: number;
    public readonly timestamp: Date;
    public readonly status: "pending" | "completed" | "failed";
    public readonly serviceType: string;

    constructor(transaction: ITransaction) {
        this._id = transaction._id?.toString();
        this.walletId = transaction.walletId.toString();
        this.type = transaction.type;
        this.amount = transaction.amount;
        this.timestamp = transaction.timestamp;
        this.status = transaction.status;
        this.serviceType = transaction.serviceType;
    }

    public static from(transaction: ITransaction): TransactionDto {
        return new TransactionDto(transaction);
    }

    public static fromList(transactions: ITransaction[]): TransactionDto[] {
        return transactions.map(t => new TransactionDto(t));
    }
}
