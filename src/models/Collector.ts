import { c } from "framer-motion/dist/types.d-O7VGXDJe";
import { Schema, Document, model } from "mongoose";

export interface ICollector extends Document {
    collectorId: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    gender: "male" | "female";
    district?: string;
    serviceArea?: string;
    authProvider: "google" | "local";
    profileUrl?: string;
    idProofType?: string;
    idProofFrontUrl?: string;
    idProofBackUrl?: string;
    verificationStatus?: "pending" | "requested" | "approved" | "rejected";
    isVerified?: boolean;
    editAccess?: boolean;
    isBlocked?: boolean;
    availabilityStatus: "available" | "unavailable" | "on_break";
    currentTasks: number;
    maxCapacity: number;
    performanceMetrics: {
        totalCollections: number;
        averageRating: number;
        onTimeRate: number;
    };
    location: {
        lat: number;
        long: number;
        updatedAt: Date;
    };
}

const collectorSchema = new Schema<ICollector>({
    collectorId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: false },
    gender: { type: String, enum: ['Male', 'Female'] },
    district: { type: String, trim: true },
    serviceArea: { type: String, trim: true },
    authProvider: { type: String, enum: ["google", "local"], default: "local" },
    profileUrl: { type: String, trim: true },
    idProofType: { type: String, enum: ['Aadhar', 'Voter-ID', 'Driving-License'] },
    idProofFrontUrl: { type: String },
    idProofBackUrl: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'requested', 'approved', 'rejected'], default: 'pending' },
    isVerified: { type: Boolean, default: false },
    editAccess: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    availabilityStatus: { type: String, enum: ["available", "unavailable", "on_break"], default: "available" },
    currentTasks: { type: Number, default: 0 },
    maxCapacity: { type: Number, default: 5 },
    performanceMetrics: {
        totalCollections: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        onTimeRate: { type: Number, default: 0 }
    },
    location: {
        lat: { type: Number },
        long: { type: Number },
        updatedAt: { type: Date }
    }
}, { timestamps: true });


interface ICounter extends Document {
    name: string;
    seq: number;
}

const counterSchema = new Schema<ICounter>({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 1000 }
});

export const Counter = model<ICounter>("Counter", counterSchema);

const Collector = model<ICollector>("Collector", collectorSchema);
export default Collector;