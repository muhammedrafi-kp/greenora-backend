
import { IChat, IMessage } from "../models/Chat"

export interface IChatService {
    startChat(chatData: Partial<IChat>): Promise<IChat>
    getChat(participant1: string, participant2: string): Promise<IChat | null>;
    getChats(): Promise<IChat[]>;

    // getChats(userId: string): Promise<IChat[]>;
    // sendMessage(chatId: string, senderId: string, receiverId: string, message: string): Promise<IMessage>;
    sendMessage(messageData: Partial<IMessage>): Promise<IMessage>;
    getMessages(chatId: string): Promise<IMessage[]>;
    markMessagesAsRead(chatId: string, userId: string): Promise<IMessage | null>
}