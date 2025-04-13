
import mongoose, { Types, Schema, model, Document, Decimal128 } from "mongoose";

export interface ICollection extends Document {
    userId: string;
    collectionId: string;
    collectorId?: string;
    type: "waste" | "scrap";
    districtId: string,
    serviceAreaId: string,
    items: {
        categoryId: string;
        name: string;
        rate: number;
        qty: number;
    }[];
    estimatedCost: number;
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
    paymentId: string;
    status: "pending" | "scheduled" | "in progress" | "cancelled" | "completed";
    scheduledAt: Date;
    collectionProof: string;
    userFeedback: {
        rating: number;
        command: string;
    };
    cancellationReason: string;
    proofs?: string[];
}