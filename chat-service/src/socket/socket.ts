import { Server, Socket } from "socket.io";
import { Chat, Message } from "../models/Chat";
import mongoose, { ObjectId, Types } from "mongoose";
import { ChatService } from "../services/chatService";
import chatRepository from "../repositories/chatRepository";
import messageRepository from "../repositories/messageRepository";
import { IChatService } from "../interfaces/IChatService";
import { redis } from '../config/redisConfig';


const chatService: IChatService = new ChatService(chatRepository, messageRepository);

const onlineUsers = new Map();

let adminOnline = false;

export const initializeSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {

        console.log("A user connected:", socket.id);
        
        socket.on("user_connected", (userId) => {
            // console.log("user-connected:", userId);
            onlineUsers.set(userId, socket.id);
            socket.broadcast.emit("user_online", userId); // Notify others only
        });

        socket.on("get_online_users", () => {
            socket.emit("online_users", Array.from(onlineUsers.keys()));
        });

        socket.on("admin_connected", () => {
            console.log("admin-connected");
            adminOnline = true;
            socket.broadcast.emit("admin_online_status", adminOnline);
        });

        socket.on("get_admin_online_status", () => {
            socket.emit("admin_online_status", adminOnline);
        });

        // JOIN CHAT ROOM
        socket.on("join_room", async (data) => {
            const { chatId, userId } = data;
            socket.join(chatId);
            console.log(`User ${userId} joined room ${chatId}`);

            await chatService.markMessagesAsRead(chatId, userId);
        });

        // LEAVE CHAT ROOM
        socket.on("leave_room", async (data) => {
            const { chatId, userId } = data;
            socket.leave(chatId);
            console.log(`User ${userId} left room ${chatId}`);
        });


        socket.on("send_message", async (data) => {
            try {
                console.log("data :", data);

                const { senderId, receiverId, message, timestamp } = data;

                let chatId = await redis.get(`chat:${senderId}-${receiverId}`);

                console.log("chatId in redis:", chatId);

                if (!chatId) {
                    const chat = await chatService.getChat(senderId, receiverId);

                    console.log("chat getting from db:", chat);

                    // Cache chat ID with TTL
                    await redis.set(`chat:${senderId}-${receiverId}`, chat?._id as string, 'EX', 86400);
                    await redis.set(`chat:${receiverId}-${senderId}`, chat?._id as string, 'EX', 86400);

                    chatId = chat?._id as string;
                }


                const messageData = {
                    chatId,
                    senderId: senderId,
                    receiverId: receiverId,
                    message: message,
                    timestamp: timestamp
                }

                const newMessage = await chatService.sendMessage(messageData);

                console.log("newMessage :", newMessage);

                console.log("newMessage.chatId :", newMessage.chatId);

                // Emit the message to the room with all necessary data
                // io.emit("receive_message", {
                // io.to(chatId).emit("receive_message", {
                io.emit("receive_message", {
                    chatId,
                    senderId: newMessage.senderId,
                    receiverId: newMessage.senderId,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp,
                    isRead: newMessage.isRead
                });
            } catch (error) {
                console.error("Error handling message:", error);
            }
        });


        socket.on("typing", (data: { userId: string, chatId: string }) => {
            console.log("user is typing :", data);
            socket.broadcast.emit("typing", data);
        });

        socket.on("stop_typing", (data: { userId: string, chatId: string }) => {
            console.log("user stopped typing :", data);
            socket.broadcast.emit("stop_typing", data);
        });

        socket.on("admin_typing", (data: { chatId: string }) => {
            const { chatId } = data;
            socket.to(chatId).emit("admin_typing");
        });

        socket.on("admin_stop_typing", (data: { chatId: string }) => {
            const { chatId } = data;
            socket.to(chatId).emit("admin_stop_typing");
        });

        // Admin explicitly disconnects
        socket.on("admin_disconnected", () => {
            adminOnline = false;
            socket.broadcast.emit("admin_online_status", adminOnline);
            console.log(`Admin is offline.`);
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);

            for (let [userId, id] of onlineUsers.entries()) {
                if (id === socket.id) {
                    onlineUsers.delete(userId);
                    socket.broadcast.emit("user_offline", userId);
                    break;
                }
            }
        });

        socket.on("get_chat_history", async (data) => {
            try {
                const { chatId } = data;
                console.log(`Fetching chat history for chat: ${chatId}`);

                const messages = await chatService.getMessages(chatId);

                socket.emit("chat_history", { messages });

            } catch (error) {
                console.error("Error fetching chat history:", error);
                socket.emit("chat_history", { messages: [] });
            }
        });
    });
};
