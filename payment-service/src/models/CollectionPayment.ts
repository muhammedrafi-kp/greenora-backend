import { Schema, model, Document, Types } from "mongoose";

export interface ICollectionPayment extends Document {
    paymentId: string;
    userId: string;
    // collectionId: string;
    advanceAmount: number;
    advancePaymentStatus: "success" | "failed" | "refunded";
    advancePaymentMethod: "online" | "wallet";
    amount: number;
    status: "pending" | "success" | "failed";
    method: "online" | "wallet" | "cash";
    orderId?: string;
    paidAt?: Date;
};

const collectionPaymentSchema = new Schema<ICollectionPayment>({
    paymentId: { type: String, required: true },
    userId: { type: String, required: true },
    // collectionId: { type: String, required: true },
    amount: { type: Number },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    advanceAmount: { type: Number, required: true },
    advancePaymentStatus: { type: String, enum: ["success", "failed", "refunded"] },
    advancePaymentMethod: { type: String, enum: ["online", "wallet"], required: true },
    method: { type: String, enum: ["online", "wallet", "cash"] },
    orderId: { type: String },
    paidAt: { type: Date },
}, { timestamps: true });

const CollectionPayment = model<ICollectionPayment>("CollectionPayment", collectionPaymentSchema);
export default CollectionPayment;