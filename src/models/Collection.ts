import mongoose, { Types, Schema, model, Document, Decimal128 } from "mongoose";

export interface ICollection extends Document {
    userId: string;
    collectionId: string;
    collectorId?: Types.ObjectId;
    type: "waste" | "scrap";
    districtId: string,
    serviceAreaId: string,
    items: {
        categoryId: Types.ObjectId;
        name: string;
        rate: number;
        qty: number;
    }[];
    estimatedCost: number;
    payment: {
        paymentId?: string;
        advanceAmount?: number;
        advancePaymentStatus?: "success" | "pending" | "failed" | "refunded";
        advancePaymentMethod?: "online" | "wallet";
        amount?: number;
        method?: "online" | "wallet" | "cash";
        status?: "pending" | "success" | "failed"|"requested";
        orderId?: string;
        paidAt?: Date;
    }
    preferredDate?: Date;
    instructions?: string;
    address: {
        name: string;
        mobile: string;
        pinCode: string;
        locality: string;
        addressLine: string;
    };
    location: {
        lat: number;
        long: number;
        updatedAt: Date;
    };
    status: "pending" | "scheduled" | "in_progress" | "cancelled" | "completed";
    scheduledAt: Date;
    collectionProof: string;
    userFeedback: {
        rating: number;
        comment: string;
    };
    cancellationReason: string;
    proofs?: string[];
}

const collectionSchema = new Schema<ICollection>(
    {
        userId: { type: String, required: true },
        collectionId: { type: String, required: true },
        collectorId: { type: mongoose.Schema.Types.ObjectId, ref: "Collector" },
        type: { type: String, enum: ["waste", "scrap"], required: true },
        districtId: { type: String, required: true },
        serviceAreaId: { type: String, required: true },
        items: [
            {
                _id: false,
                categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
                name: { type: String, required: true },
                rate: { type: Number, required: true },
                qty: { type: Number, required: true },
            }
        ],
        estimatedCost: { type: Number, required: true },
        preferredDate: { type: Date, required: true },
        instructions: { type: String },
        address: {
            name: { type: String, required: true },
            mobile: { type: String, required: true },
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
        payment: {
            paymentId: { type: String },
            advanceAmount: { type: Number },
            advancePaymentStatus: { type: String, enum: ["success", "pending", "failed", "refunded"] },
            advancePaymentMethod: { type: String, enum: ["online", "wallet"] },
            amount: { type: Number },
            method: { type: String, enum: ["online", "wallet", "cash"] },
            status: { type: String, enum: ["pending", "success", "failed","requested"] },
            orderId: { type: String },
            paidAt: { type: Date }
        },
        status: { type: String, enum: ["pending", "scheduled", "in progress", "cancelled", "completed"], default: "pending" },
        scheduledAt: { type: Date },
        collectionProof: { type: String },
        userFeedback: {
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String }
        },
        cancellationReason: { type: String },
        proofs: { type: [String] }
    },
    { timestamps: true }
);

const Collection = model<ICollection>("Collection", collectionSchema);
export default Collection;
