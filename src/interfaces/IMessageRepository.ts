import { IBaseRepository } from "./IBaseRepository";
import { IMessage } from "../models/Chat";

export interface IMessageRepository extends IBaseRepository<IMessage> {
    createMessage(messageData: Partial<IMessage>): Promise<IMessage>;
    getMessages(chatId: string): Promise<IMessage[]>;
    markMessagesAsRead(messageId: string): Promise<IMessage | null>;
}