import { Types, Schema, model, Document, Decimal128 } from "mongoose";

export interface IRequest extends Document {
    userId: Types.ObjectId;
    categoryId: Types.ObjectId;
    collectorId?: Types.ObjectId;
    category: "waste" | "scrap";
    wasteDetails?: {
        wasteType: string;
        estimatedWeight: Decimal128;
        price: Decimal128;
    }[];
    scrapDetails?: {
        estimatedWeight: Decimal128;
        price: Decimal128;
        scrapType: string;
    }[];
    location: {
        address: string;
        lat: Decimal128;
        long: Decimal128;
    };
    advancePayment: Decimal128;
    paymentStatus: "pending" | "paid" | "failed";
    status: "pending" | "assigned" | "completed";
    scheduledAt: Date;
    preferredDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        collectorId: { type: Schema.Types.ObjectId, ref: "Collector" },
        category: { type: String, enum: ["waste", "scrap"], required: true },
        wasteDetails: [
            {
                wasteType: { type: String, required: true },
                estimatedWeight: { type: Number },
                price: { type: Number }
            }
        ],
        scrapDetails: [
            {
                estimatedWeight: { type: Number },
                price: { type: Number },
                scrapType: { type: String }
            }
        ],
        location: {
            address: { type: String },
            lat: { type: Number },
            long: { type: Number }
        },
        advancePayment: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
        status: { type: String, enum: ["pending", "assigned", "completed"], default: "pending" },
        scheduledAt: { type: Date, required: true },
        preferredDate: { type: Date },
    },
    { timestamps: true }
);

const Request = model<IRequest>("Request", requestSchema);
export default Request;
