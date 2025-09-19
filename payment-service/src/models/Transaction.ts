import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
    _id: Types.ObjectId;
    walletId: Types.ObjectId;
    type: "debit" | "credit" | "refund";
    amount: number;
    timestamp: Date;
    status: "pending" | "completed" | "failed";
    serviceType: string;
}

const TransactionSchema = new Schema<ITransaction>({
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["debit", "credit", "refund"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], required: true },
    serviceType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);