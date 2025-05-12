import { Document, Schema, model } from "mongoose";

export interface INotification extends Document {
    userId: string;
    title: string;
    message: string;
    url: string;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    url: { type: String, required: false },
}, { timestamps: true });

export const Notification = model<INotification>('Notification', notificationSchema);

