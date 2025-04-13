import mongoose, { Schema, Document, Double } from "mongoose";

export interface ITransaction {
    type: "debit" | "credit"|"refund";
    amount: number;
    timestamp: Date;
    status: "pending" | "completed" | "failed";
    serviceType: string;
}

export interface IWallet extends Document {
    userId: string;
    balance: number;
    transactions: ITransaction[];
    status: "active" | "suspended" | "closed";
}

const TransactionSchema = new Schema<ITransaction>({
    type: { type: String, enum: ["debit", "credit","refund"], required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "completed", "failed"], required: true },
    serviceType: { type: String, required: true }
},
    { _id: false }
);

const WalletSchema = new Schema<IWallet>({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0.00 },
    transactions: [TransactionSchema],
    status: { type: String, enum: ["active", "suspended", "closed"], default: "active" },
}, { timestamps: true });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
