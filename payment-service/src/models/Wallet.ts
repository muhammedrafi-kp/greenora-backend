// import mongoose, { Schema, Document, Double } from "mongoose";

// export interface ITransaction {
//     _id?: string;
//     type: "debit" | "credit" | "refund";
//     amount: number;
//     timestamp: Date;
//     status: "pending" | "completed" | "failed";
//     serviceType: string;
// }

// export interface IWallet extends Document {
//     userId: string;
//     balance: number;
//     transactions: ITransaction[];
//     status: "active" | "suspended" | "closed";
// }

// const TransactionSchema = new Schema<ITransaction>({
//     type: { type: String, enum: ["debit", "credit", "refund"], required: true },
//     amount: { type: Number, required: true },
//     status: { type: String, enum: ["pending", "completed", "failed"], required: true },
//     serviceType: { type: String, required: true },
//     timestamp: { type: Date, default: Date.now }
// }
// );

// const WalletSchema = new Schema<IWallet>({
//     userId: { type: String, required: true, unique: true },
//     balance: { type: Number, required: true, default: 0.00 },
//     transactions: [TransactionSchema],
//     status: { type: String, enum: ["active", "suspended", "closed"], default: "active" },
// }, { timestamps: true });

// export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);



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