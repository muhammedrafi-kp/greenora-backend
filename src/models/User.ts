import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    authProvider: "google" | "local";
    profileUrl?: string;
    isBlocked?: boolean;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    profileUrl: { type: String },
    authProvider: { type: String, enum: ["google", "local"], default: "local" },
    phone: { type: String, required: false },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

const User =  model<IUser>('User', userSchema);
export default User;