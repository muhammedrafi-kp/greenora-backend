
import { CreateChatDto } from "../dtos/request/createChatDto.dto";
import { ChatDto } from "../dtos/response/chat.dto";
import { CreateMessageDto } from "../dtos/request/createMessageDto.dto";
import { MessageDto } from "../dtos/response/message.dto";

export interface IChatService {
    startChat(chatData: CreateChatDto): Promise<ChatDto>;
    getChat(participant1: string, participant2: string): Promise<ChatDto | null>;
    getChats(): Promise<ChatDto[]>;

    sendMessage(messageData: CreateMessageDto): Promise<MessageDto>;
    getMessages(chatId: string): Promise<MessageDto[]>;
    markMessagesAsRead(chatId: string, userId: string): Promise<void>
}