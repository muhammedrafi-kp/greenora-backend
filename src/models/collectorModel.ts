import { Schema, Document, model } from "mongoose";

export interface ICollector extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    profileUrl?: string;
    serviceArea?: string;
    isVerified?: boolean;
    isBlocked?: boolean;
}

const collectorSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    serviceArea: { type: String, required: false },
    profileUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

export default model<ICollector>("Collector", collectorSchema);