import { Request, Response } from "express";
import { IChatController } from "../interfaces/IChatController";
import { IChatService } from "../interfaces/IChatService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import getGeminiResponse from "../config/chatbotConfig";

export class ChatController implements IChatController {
    constructor(private chatService: IChatService) { };

    // async sendMessage(req: Request, res: Response): Promise<void> {
    //     try {
    //         const { senderId, receiverId, message } = req.body;
    //         const newMessage = await this.chatService.sendMessage(senderId, receiverId, message);

    //         res.status(HTTP_STATUS.CREATED).json({
    //             success: true,
    //             message: MESSAGES.MESSAGE_CREATED,
    //             data: newMessage
    //         });

    //     } catch (error) {
    //         console.error("Error during calculate cost:", error);
    //         res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
    //     }
    // }

    async createChat(req: Request, res: Response): Promise<void> {
        try {
            const chatData = req.body;
            console.log("chatData :",chatData);
            const chat = await this.chatService.startChat(chatData);
            // console.log("chat :",chat);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: chat
            });
        } catch (error) {
            console.error("Error during fetch chats:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async getChats(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'] as string;

            const chats = await this.chatService.getChats(userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: chats
            });
        } catch (error) {
            console.error("Error during fetch chats:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const { chatId } = req.params;
            const messages = await this.chatService.getMessages(chatId);

            // console.log("messages :",messages);
            
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: messages
            });

        } catch (error) {
            console.error("Error during calculate cost:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async markMessagesAsRead(req: Request, res: Response): Promise<void> {
        try {
            const { senderId, receiverId } = req.params;
            await this.chatService.markMessagesAsRead(senderId, receiverId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: MESSAGES.MARKED_AS_READ
            });
        } catch (error) {
            console.error("Error during calculate cost:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async chatbotHandler(req: Request, res: Response): Promise<void> {
        try {
            const { prompt } = req.body;
            if (!prompt) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            const response = await getGeminiResponse(prompt);

            res.status(200).json({ response });

        } catch (error) {
            console.error("Error during calculate cost:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

}