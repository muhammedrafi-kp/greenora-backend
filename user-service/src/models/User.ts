import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
    _id:string;
    name: string;
    email: string;
    phone: string;
    password: string;
    profileUrl?: string;
    authProvider: "google" | "local";
    isBlocked: boolean;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: false },
    profileUrl: { type: String },
    authProvider: { type: String, enum: ["google", "local"], default: "local" },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

const User =  model<IUser>('User', userSchema);
export default User;