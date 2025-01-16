import { Schema, Document, model } from 'mongoose';

export interface IAdmin extends Document {
    email: string;
    password: string;
}

const adminSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

export default  model<IAdmin>('Admin', adminSchema);