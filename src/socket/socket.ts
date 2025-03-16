import { Server, Socket } from "socket.io";
import { Chat, Message } from "../models/Chat";
import mongoose, { ObjectId, Types } from "mongoose";
import { ChatService } from "../services/chatService";
import chatRepository from "../repositories/chatRepository";
import messageRepository from "../repositories/messageRepository";
import { IChatService } from "../interfaces/IChatService";
import { IMessage } from "../models/Chat";
import Redis from "ioredis";
const redis = new Redis();

const chatService: IChatService = new ChatService(chatRepository, messageRepository);


export const initializeSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        socket.on("leave-room", (roomId: string) => {
            socket.leave(roomId);
            console.log(`User ${socket.id} left room ${roomId}`);
        });


        socket.on("send-message", async (data) => {
            try {
                // const { text, roomId, senderId, receiverId } = messageData;
                console.log("data :", data);

                const { participant1, participant2, message, timestamp } = data;

                let chatId = await redis.get(`chat:${participant1}-${participant2}`);

                console.log("chatId in redis:", chatId);
                if (!chatId) {
                    const chat = await chatService.getChat(participant1,participant2);

                    console.log("chat getting from db:", chat)
                    // Cache chat ID with TTL
                    await redis.set(`chat:${participant1}-${participant2}`, chat?._id  as string, 'EX', 86400);
                    await redis.set(`chat:${participant2}-${participant1}`, chat?._id as string, 'EX', 86400);

                    chatId = chat?._id as string;

                    console.log("chatId :",chatId)
                }


                const messageData = {
                    chatId,
                    senderId: participant1,
                    receiverId: participant2,
                    message: message,
                    timestamp: timestamp
                }

                const newMessage = await chatService.sendMessage(messageData);

                console.log("newMessage :", newMessage);

                // Emit the message to the room with all necessary data
                io.to(newMessage.chatId).emit("receive-message", {
                    chatId,
                    senderId: newMessage.senderId,
                    receiverId:newMessage.senderId,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp,
                    isRead: newMessage.isRead
                });

                // console.log(`Message sent in room ${roomId}`);
            } catch (error) {
                console.error("Error handling message:", error);
            }
        });

        socket.on("disconnect-admin", () => {
            console.log(`User ${socket.id} disconnected from admin chat`);
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });

        socket.on("get-chat-history", async (data) => {
            try {
                const { chatId } = data;
                console.log(`Fetching chat history for chat: ${chatId}`);

                // Get messages from database
                const messages = await chatService.getMessages(chatId);

                console.log("messages in socket :", messages);

                // Send messages back to client
                socket.emit("chat-history", { messages });

            } catch (error) {
                console.error("Error fetching chat history:", error);
                socket.emit("chat-history", { messages: [] });
            }
        });
    });
};
