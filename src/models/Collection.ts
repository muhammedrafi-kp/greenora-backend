import { Types, Schema, model, Document, Decimal128 } from "mongoose";

export interface ICollection extends Document {
    userId: string;
    collectionId: string;
    collectorId?: Types.ObjectId;
    type: "waste" | "scrap";
    items: {
        categoryId: Types.ObjectId;
        qty: number;
    }[];
    estimatedCost: number;
    preferredDate?: Date;
    instructions?: string;
    address: {
        name: string;
        mobile: string;
        district: string;
        serviceArea: string;
        pinCode: string;
        locality: string;
        addressLine: string;
    };
    advancePayment: number;
    paymentStatus: "pending" | "paid" | "failed";
    status: "pending" | "scheduled" | "cancelled" | "completed";
    scheduledAt: Date;
}

const requestSchema = new Schema<ICollection>(
    {
        userId: { type: String, required: true },
        collectionId: { type: String, required: true },
        collectorId: { type: Schema.Types.ObjectId, ref: "Collector" },
        type: { type: String, enum: ["waste", "scrap"], required: true },
        items: [
            {
                categoryId: { type: Schema.Types.ObjectId, required: true },
                qty: { type: Number, required: true },
            }
        ],
        estimatedCost: { type: Number, required: true },
        preferredDate: { type: Date, required: true },
        instructions: { type: String },
        address: {
            name: { type: String, required: true },
            mobile: { type: String, required: true },
            district: { type: String, required: true },
            serviceArea: { type: String, required: true },
            pinCode: { type: String, required: true },
            locality: { type: String, required: true },
            addressLine: { type: String, required: true },
            lat: { type: Number },
            long: { type: Number }
        },
        advancePayment: { type: Number, default: 50 },
        paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
        status: { type: String, enum: ["pending", "scheduled", "cancelled", "completed"], default: "pending" },
        scheduledAt: { type: Date },
    },
    { timestamps: true }
);

const Collection = model<ICollection>("Collection", requestSchema);
export default Collection;
