import { IChatRepository } from "../interfaces/IChatRepository";
import { Message, IMessage } from "../models/Chat";
import { BaseRepository } from "./baseRepository";
import { IMessageRepository } from "../interfaces/IMessageRepository";


class MessageRepository extends BaseRepository<IMessage> implements IMessageRepository {
    constructor() {
        super(Message);
    }

    async createMessage(messageData: Partial<IMessage>): Promise<IMessage> {
        try {

            return await this.create(messageData);

        } catch (error) {
            throw new Error(`Error while finding creating new message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getMessages(chatId: string): Promise<any[]> {
        try {
            // return await this.model.find({
            //     $or: [
            //         { senderId, receiverId },
            //         { senderId: receiverId, receiverId: senderId }
            //     ]
            // }).sort({ timestamp: 1 });
            return await this.model.find({ chatId }).sort({ timestamp: 1 });

        } catch (error) {
            throw new Error(`Error while finding messages: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async markMessagesAsRead(messageId: string): Promise<IMessage | null> {
        try {
            // await this.model.updateMany(
            //     { senderId, receiverId, isRead: false },
            //     { $set: { isRead: true } }
            // );
            return await this.updateById(messageId, { isRead: true });

        } catch (error) {
            throw new Error(`Error while marking message as read: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new MessageRepository();