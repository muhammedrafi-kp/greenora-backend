import { Schema, Document, model } from "mongoose";

export interface ICollector extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    district?: string;
    serviceArea?: string;
    profileUrl?: string;
    idProofType?: string;
    idProofFrontUrl?: string;
    idProofBackUrl?: string;
    isVerified?: boolean;
    isBlocked?: boolean;
}

const collectorSchema = new Schema<ICollector>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    district: { type: String, trim: true },
    serviceArea: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    idProofType: { type: String, enum: ['Aadhar', 'Voter-ID', 'Driving-License'] },
    idProofFrontUrl: { type: String },
    idProofBackUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const Collector = model<ICollector>("Collector", collectorSchema);
export default Collector;