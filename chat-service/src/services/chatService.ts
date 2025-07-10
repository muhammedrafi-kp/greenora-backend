import { IChatRepository } from "../interfaces/IChatRepository";
import { IMessageRepository } from "../interfaces/IMessageRepository";
import { IChatService } from "../interfaces/IChatService";
import { IChat, IMessage } from "../models/Chat";

export class ChatService implements IChatService {
    constructor(
        private _chatRepository: IChatRepository,
        private _messageRepository: IMessageRepository
    ) { };

    async startChat(chatData: Partial<IChat>): Promise<IChat> {
        try {
            const { participant1, participant2 } = chatData;
            let chat = await this._chatRepository.findOne({ participant1, participant2 });
            
            if (!chat) {
                chat = await this._chatRepository.createChat(chatData);
            }
            return chat;

        } catch (error) {
            console.error('Error while creating chat:', error);
            throw error;
        }
    }

    async getChat(participant1: string, participant2: string): Promise<IChat | null> {
        try {
            let chat = await this._chatRepository.findOne({
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
            return this._chatRepository.find({});
        } catch (error) {
            console.error('Error while finding chats:', error);
            throw error;
        }
    }

    async sendMessage(messageData: IMessage): Promise<IMessage> {
        try {
            const { chatId, message } = messageData;
            const newMessage = await this._messageRepository.create(messageData);

            await this._chatRepository.updateLastMessage(chatId, message);

            return newMessage;

        } catch (error) {
            console.error('Error while sending message:', error);
            throw error;
        }
    }

    async getMessages(chatId: string): Promise<IMessage[]> {
        try {
            return this._messageRepository.getMessages(chatId);
        } catch (error) {
            console.error('Error while finding messages:', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatId: string, userId: string): Promise<any> {
        try {
            return this._messageRepository.updateMany(
                { chatId, receiverId: userId, isRead: false },
                { $set: { isRead: true } }
            );
        } catch (error) {
            console.error('Error while marking message as read:', error);
            throw error;
        }
    }
}