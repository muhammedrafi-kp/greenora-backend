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

    async getChats(): Promise<IChat[]> {
        try {
            return this.chatRepository.find({});
        } catch (error) {
            console.error('Error while finding chats:', error);
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