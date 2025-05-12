import { IBaseRepository } from "./IBaseRepository";
import { IChat } from "../models/Chat";

export interface IChatRepository extends IBaseRepository<IChat> {
    createChat(chatData:Partial<IChat>): Promise<IChat>;
    findChat(senderId: string, receiverId: string): Promise<IChat | null>
    updateLastMessage(chatId: string, lastMessage: string): Promise<IChat | null>
}