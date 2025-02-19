import { Schema, model, Document, Types } from "mongoose";

export interface ICollectionPayment extends Document {
    userId: string;
    collectionId: string;
    transactionId: string;
    amount: number;
    status: "pending" | "success" | "failed";
    method: "online" | "wallet" | "cash";
    paidAt?: Date;
};

const collectionPaymentSchema = new Schema<ICollectionPayment>({
    userId: { type: String, required: true },
    collectionId: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    method: { type: String, enum: ["online", "wallet", "cash"], required: true },
    paidAt: { type: Date },
}, { timestamps: true });

const CollectionPayment = model<ICollectionPayment>("CollectionPayment", collectionPaymentSchema);
export default CollectionPayment;