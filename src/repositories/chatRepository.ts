import { IChatRepository } from "../interfaces/IChatRepository";
import { Chat, IChat } from "../models/Chat";
import { BaseRepository } from "./baseRepository";


class ChatRepository extends BaseRepository<IChat> implements IChatRepository {
    constructor() {
        super(Chat);
    }

    async createChat(chatData: Partial<IChat>): Promise<IChat> {
        try {
            const chat = new Chat(chatData);
            return await chat.save();
        } catch (error) {
            throw new Error(`Error while creating chat: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findChat(senderId: string, receiverId: string): Promise<IChat | null> {
        try {
            return await this.findOne({ senderId, receiverId });
        } catch (error) {
            throw new Error(`Error while finding chat: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateLastMessage(chatId: string, lastMessage: string): Promise<IChat | null> {
        try {
            return await this.updateById(chatId, { lastMessage });
        } catch (error) {
            throw new Error(`Error while updating last message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new ChatRepository();