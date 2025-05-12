import { Schema, model, Document, Types } from "mongoose";

export interface ISubscriptionPayment extends Document {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    transactionId: string;
    amount: number;
    status: "pending" | "success" | "failed";
    method: "online" | "wallet" | "cash";
    paidAt?: Date;
};

const subscriptionPaymentSchema = new Schema<ISubscriptionPayment>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    method: { type: String, enum: ["online", "wallet", "cash"], required: true },
    paidAt: { type: Date },
}, { timestamps: true });

const SubscriptionPayment = model<ISubscriptionPayment>("SubscriptionPayment", subscriptionPaymentSchema);
export default SubscriptionPayment;