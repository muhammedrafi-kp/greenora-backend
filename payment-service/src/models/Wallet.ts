import mongoose, { Schema, Document, Double, Types } from "mongoose";

export interface IWallet extends Document {
    _id:Types.ObjectId;
    userId: string;
    balance: number;
    status: "active" | "suspended" | "closed";
}

const WalletSchema = new Schema<IWallet>({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0.00 },
    status: { type: String, enum: ["active", "suspended", "closed"], default: "active" },
}, { timestamps: true });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);