export interface CreateMessageDto {
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: Date;
}
