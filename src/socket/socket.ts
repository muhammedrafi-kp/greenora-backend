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

const onlineUsers = new Map();
let adminOnline = false;

export const initializeSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("A user connected:", socket.id);

        socket.on('user-online', (userId) => {
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);
            console.log(`User ${userId} is online.`);

            // Emit to everyone that this user is online
            io.emit('update-user-status', { userId, status: 'online' });

            // If admin is online, let this user know
            if (adminOnline) {
                socket.emit('admin-status-changed', { status: 'online' });
            } else {
                socket.emit('admin-status-changed', { status: 'offline' });
            }
        });


        // ADMIN ONLINE STATUS
        socket.on('admin-online', (adminId) => {
            if (!onlineUsers.has(adminId)) {
                onlineUsers.set(adminId, new Set());
            }
            onlineUsers.get(adminId).add(socket.id);
            adminOnline = true;
            console.log(`Admin ${adminId} is online.`);

            // Broadcast to all users that admin is online
            io.emit('admin-status-changed', { status: 'online' });
        });


        // JOIN CHAT ROOM
        socket.on("join-room", async (data) => {
            const { chatId, userId } = data;
            socket.join(chatId);
            console.log(`User ${userId} joined room ${chatId}`);

            // Mark messages as read when joining room
            await chatService.markMessagesAsRead(chatId, userId);
        });

        // LEAVE CHAT ROOM
        socket.on("leave-room", async (data) => {
            const { chatId, userId } = data;
            socket.leave(chatId);
            console.log(`User ${userId} left room ${chatId}`);
        });


        socket.on("send-message", async (data) => {
            try {
                // const { text, roomId, senderId, receiverId } = messageData;
                console.log("data :", data);

                const { participant1, participant2, message, timestamp } = data;

                let chatId = await redis.get(`chat:${participant1}-${participant2}`);

                console.log("chatId in redis:", chatId);
                if (!chatId) {
                    const chat = await chatService.getChat(participant1, participant2);

                    console.log("chat getting from db:", chat)
                    // Cache chat ID with TTL
                    await redis.set(`chat:${participant1}-${participant2}`, chat?._id as string, 'EX', 86400);
                    await redis.set(`chat:${participant2}-${participant1}`, chat?._id as string, 'EX', 86400);

                    chatId = chat?._id as string;

                    console.log("chatId :", chatId)
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
                    receiverId: newMessage.senderId,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp,
                    isRead: newMessage.isRead
                });

                // console.log(`Message sent in room ${roomId}`);
            } catch (error) {
                console.error("Error handling message:", error);
            }
        });

        // Admin explicitly disconnects
        socket.on("admin-disconnect", () => {
            adminOnline = false;
            io.emit('admin-status-changed', 'offline');
            console.log(`Admin is offline.`);
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);

            // Find which user this socket belongs to
            for (const [userId, socketSet] of onlineUsers.entries()) {
                if (socketSet.has(socket.id)) {
                    socketSet.delete(socket.id);

                    // If this was an admin socket
                    if (adminOnline && userId === "ADMIN_ID") { // Replace with your admin ID check
                        if (socketSet.size === 0) {
                            adminOnline = false;
                            io.emit('admin-status-changed', { status: 'offline' });
                            console.log(`Admin is offline.`);
                        }
                    }

                    // If this was the last socket for this user
                    if (socketSet.size === 0) {
                        onlineUsers.delete(userId);
                        io.emit('update-user-status', { userId, status: 'offline' });
                        console.log(`User ${userId} is offline.`);
                    }

                    break;
                }
            }
        });



            socket.on("get-chat-history", async (data) => {
                try {
                    const { chatId } = data;
                    console.log(`Fetching chat history for chat: ${chatId}`);

                    // Get messages from database
                    const messages = await chatService.getMessages(chatId);

                    // console.log("messages in socket :", messages);

                    // Send messages back to client
                    socket.emit("chat-history", { messages });

                } catch (error) {
                    console.error("Error fetching chat history:", error);
                    socket.emit("chat-history", { messages: [] });
                }
            });
        });
    };
