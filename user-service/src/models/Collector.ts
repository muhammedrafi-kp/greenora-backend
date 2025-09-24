import { Schema, Document, model, Types } from "mongoose";

export interface ICollector extends Document {
    _id: string;
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
    isVerified: boolean;
    editAccess: boolean;
    isBlocked: boolean;
    availabilityStatus: "available" | "unavailable" | "on_break";
    currentTasks: number;
    maxCapacity: number;
    assignedTasks: string[];
    dailyTaskCounts: Map<string, number>;
    ratings?: {
        taskId: string;
        rating: number;
        comment?: string;
        ratedAt: Date;
    }[];
    performanceMetrics: {
        totalCollections: number;
        avgRating: number;
    };
    location: {
        lat: number;
        long: number;
        updatedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
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
    assignedTasks: [{ type: String }],
    dailyTaskCounts: { type: Map, of: Number, default: {} },
    ratings: [
        {
            taskId: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String },
            ratedAt: { type: Date, default: Date.now }
        }
    ],
    performanceMetrics: {
        totalCollections: { type: Number, default: 0 },
        avgRating: { type: Number, default: 0 },
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