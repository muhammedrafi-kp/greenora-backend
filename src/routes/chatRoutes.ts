import { Router } from "express";
import chatRepository from "../repositories/chatRepository";
import messageRepository from "../repositories/messageRepository";
import { ChatService } from "../services/chatService";
import { ChatController } from "../controllers/chatController";

const chatService = new ChatService(chatRepository,messageRepository);
const chatController = new ChatController(chatService);

const router = Router();

// router.post("/send", chatController.sendMessage.bind(chatController));
router.post("/chat",chatController.createChat.bind(chatController));
router.get("/chats", chatController.getChats.bind(chatController));
router.get("/messages/:chatId", chatController.getMessages.bind(chatController));
router.put("/mark-read/:senderId/:receiverId", chatController.markMessagesAsRead.bind(chatController));
router.post('/chatbot',chatController.chatbotHandler.bind(chatController));

export default router;
