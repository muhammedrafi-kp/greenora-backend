import {Request,Response} from "express";

export interface IChatController{
    // sendMessage(req: Request, res: Response): Promise<void>;
    createChat(req: Request, res: Response): Promise<void>;
    getChats(req: Request, res: Response): Promise<void>;
    getMessages(req: Request, res: Response): Promise<void>;
    markMessagesAsRead(req: Request, res: Response): Promise<void>;
    chatbotHandler (req: Request, res: Response): Promise<void>;
}