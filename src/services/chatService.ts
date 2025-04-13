import { IChatRepository } from "../interfaces/IChatRepository";
import { IMessageRepository } from "../interfaces/IMessageRepository";
import { IChatService } from "../interfaces/IChatService";
import { IChat, IMessage } from "../models/Chat";
import { v4 as uuidv4 } from 'uuid';
import mongoose from "mongoose";
import axios from 'axios';

export class ChatService implements IChatService {
    constructor(
        private chatRepository: IChatRepository,
        private messageRepository: IMessageRepository
    ) { };

    async startChat(chatData: Partial<IChat>): Promise<IChat> {
        try {
            const { participant1, participant2 } = chatData;
            let chat = await this.chatRepository.findOne({ participant1, participant2 });
            if (!chat) {
                chat = await this.chatRepository.createChat(chatData);
            }
            return chat;

        } catch (error) {
            console.error('Error while creating chat:', error);
            throw error;
        }
    }

    async getChat(participant1: string, participant2: string): Promise<IChat | null> {
        try {
            let chat = await this.chatRepository.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });
            return chat;
        } catch (error) {
            console.error('Error while finding chat:', error);
            throw error;
        }
    }

    async getChats(userId: string): Promise<IChat[]> {
        try {
            // const filter = { $or: [{ senderId: userId }, { receiverId: userId }] };
            const chats = await this.chatRepository.find({});

            // console.log("chats:", chats);

            const userIds = new Set<string>();
            const collectorIds = new Set<string>();

            // chats.forEach((chat) => {
            //     if (chat.participant1Role === "user") {
            //         userIds.add(chat.participant1);
            //     } else if (chat.participant1Role === "collector") {
            //         collectorIds.add(chat.participant1);
            //     }

            //     if (chat.participant2Role === "user") {
            //         userIds.add(chat.participant2);
            //     } else if (chat.participant2Role === "collector") {
            //         collectorIds.add(chat.participant2);
            //     }
            // });

            chats.forEach((chat) => {
                if (chat.participant1Role === "user") {
                    userIds.add(chat.participant1);
                }

                if (chat.participant2Role === "user") {
                    userIds.add(chat.participant2);
                }
            });

            chats.forEach((chat) => {
                if (chat.participant1Role === "collector") {
                    userIds.add(chat.participant1);
                }

                if (chat.participant2Role === "collector") {
                    userIds.add(chat.participant2);
                }
            });


            // console.log("userIds:", Array.from(userIds));
            // console.log("collectorIds:", Array.from(collectorIds));

            const usersResponse = await axios.post("http://localhost:3001/user/users/batch", Array.from(userIds));
            // const collectorsResponse = await axios.post("http://localhost:3001/collector/collectors/batch", Array.from(collectorIds));

            // console.log("response from user service:", usersResponse.data);

            const usersData = usersResponse.data.data;
            // const collectorsData = collectorsResponse.data.collectors;

            const userDetailsMap = new Map<string, any>();
            // const collectorDetailsMap = new Map<string, any>();

            usersData.forEach((user: any) => {
                userDetailsMap.set(user._id, user);
            });

            // collectorsData.forEach((collector: any) => {
            //     collectorDetailsMap.set(collector.id, collector);
            // });

            // const enrichedChats = chats.map((chat) => {
            //     const participant1Details = chat.participant1Role === "user"
            //         ? userDetailsMap.get(chat.participant1)
            //         : collectorDetailsMap.get(chat.participant1);

            //     const participant2Details = chat.participant2Role === "user"
            //         ? userDetailsMap.get(chat.participant2)
            //         : collectorDetailsMap.get(chat.participant2);

            //     return {
            //         ...chat.toObject(),
            //         participant1Details,
            //         participant2Details,
            //     };
            // });

            const enrichedChats = chats.map((chat) => {
                const participant1Details = chat.participant1Role === "user"
                    ? userDetailsMap.get(chat.participant1)
                    : null; // No collector details needed

                const participant2Details = chat.participant2Role === "user"
                    ? userDetailsMap.get(chat.participant2)
                    : null; // No collector details needed

                return {
                    ...chat.toObject(),
                    // participant1: participant1Details,
                    // participant2: participant2Details,
                    participant1Details,
                    participant2Details,
                };
            });


            // console.log("final chats :", enrichedChats);

            return enrichedChats;
        } catch (error) {
            // console.error('Error while finding chats:', error);
            throw error;
        }
    }

    async sendMessage(messageData: IMessage): Promise<IMessage> {
        try {
            const { chatId, message } = messageData;
            const newMessage = await this.messageRepository.create(messageData);

            await this.chatRepository.updateLastMessage(chatId, message);

            return newMessage;

        } catch (error) {
            console.error('Error while sending message:', error);
            throw error;
        }
    }

    async getMessages(chatId: string): Promise<IMessage[]> {
        try {
            return this.messageRepository.getMessages(chatId);
        } catch (error) {
            console.error('Error while finding messages:', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatId: string, userId: string): Promise<any> {
        try {
            return this.messageRepository.updateMany(
                { chatId, receiverId: userId, isRead: false },
                { $set: { isRead: true } }
            );
        } catch (error) {
            console.error('Error while marking message as read:', error);
            throw error;
        }
    }
}