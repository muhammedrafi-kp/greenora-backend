import { IChatRepository } from "../interfaces/IChatRepository";
import { IMessageRepository } from "../interfaces/IMessageRepository";
import { IChatService } from "../interfaces/IChatService";
import { CreateChatDto } from "../dtos/request/createChatDto.dto";
import { CreateMessageDto } from "../dtos/request/createMessageDto.dto";
import { ChatDto } from "../dtos/response/chat.dto";
import { MessageDto } from "../dtos/response/message.dto";

export class ChatService implements IChatService {
    constructor(
        private _chatRepository: IChatRepository,
        private _messageRepository: IMessageRepository
    ) { };

    async startChat(chatData: CreateChatDto): Promise<ChatDto> {
        try {
            const { participant1, participant2 } = chatData;
            let chat = await this._chatRepository.findOne({ participant1, participant2 });

            if (!chat) {
                chat = await this._chatRepository.create(chatData);
            }

            return ChatDto.from(chat);

        } catch (error) {
            console.error('Error while creating chat:', error);
            throw error;
        }
    }

    async getChat(participant1: string, participant2: string): Promise<ChatDto | null> {
        try {
            let chat = await this._chatRepository.findOne({
                $or: [
                    { participant1, participant2 },
                    { participant1: participant2, participant2: participant1 }
                ]
            });
            if (!chat) return null;
            return ChatDto.from(chat);
        } catch (error) {
            console.error('Error while finding chat:', error);
            throw error;
        }
    }

    async getChats(): Promise<ChatDto[]> {
        try {
            const chats = await this._chatRepository.find({});
            return ChatDto.fromList(chats);
        } catch (error) {
            console.error('Error while finding chats:', error);
            throw error;
        }
    }

    async sendMessage(messageData: CreateMessageDto): Promise<MessageDto> {
        try {
            const { chatId, message } = messageData;
            const newMessage = await this._messageRepository.create(messageData);

            await this._chatRepository.updateById(chatId, { lastMessage: message });

            return MessageDto.from(newMessage);

        } catch (error) {
            console.error('Error while sending message:', error);
            throw error;
        }
    }

    async getMessages(chatId: string): Promise<MessageDto[]> {
        try {
            const messages = await this._messageRepository.find({ chatId }, {}, { timestamp: 1 });
            return MessageDto.fromList(messages);
        } catch (error) {
            console.error('Error while finding messages:', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
        try {
            await this._messageRepository.updateMany(
                { chatId, receiverId: userId, isRead: false },
                { $set: { isRead: true } }
            );
        } catch (error) {
            console.error('Error while marking message as read:', error);
            throw error;
        }
    }
}