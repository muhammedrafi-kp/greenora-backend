import { timeStamp } from "console";
import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IChat extends Document {
    participant1: string;
    participant2: string;
    participant2Name: string;
    participant2ProfileUrl: string;
    lastMessage: string;
    participant1Role: 'admin' ;
    participant2Role: 'user' | 'collector';
}

const chatSchema = new Schema<IChat>({
    participant1: { type: String, required: true },
    participant2: { type: String, required: true },
    lastMessage: { type: String, default: null },
    participant1Role: { type: String, enum: ["admin"], default: "admin", required: true, },
    participant2Role: { type: String, enum: ["user", "collector"], required: true, },
    participant2Name: { type: String, default: null },
    participant2ProfileUrl: { type: String, default: null },
}, { timestamps: true });


export const Chat = model("Chat", chatSchema);

export interface IMessage extends Document {
    chatId: string;
    senderId: string;
    receiverId: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
}


const messageSchema = new Schema<IMessage>({
    chatId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
})


export const Message = model("Message", messageSchema);