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
    location: {
        lat: number;
        long: number;
        updatedAt: Date;
    };
    advancePayment: number;
    paymentId: string;
    paymentStatus: "pending" | "paid" | "failed";
    status: "pending" | "scheduled" | "cancelled" | "completed";
    scheduledAt: Date;
    collectionProof: string;
    userFeedback: {
        rating: number;
        command: string;
    };
    cancellationReason: string;

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
        location: {
            lat: { type: Number },
            long: { type: Number },
            updatedAt: { type: Date }
        },
        advancePayment: { type: Number, default: 50 },
        paymentId: { type: String, required: true },
        paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
        status: { type: String, enum: ["pending", "scheduled", "cancelled", "completed"], default: "pending" },
        scheduledAt: { type: Date },
        collectionProof: { type: String },
        userFeedback: {
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String }
        },
        cancellationReason: { type: String }
    },
    { timestamps: true }
);

const Collection = model<ICollection>("Collection", requestSchema);
export default Collection;
