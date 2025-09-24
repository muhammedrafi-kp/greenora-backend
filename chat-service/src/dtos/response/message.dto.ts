import { IMessage } from "../../models/Chat";

export class MessageDto {
    public readonly _id: string;
    public readonly chatId: string;
    public readonly senderId: string;
    public readonly receiverId: string;
    public readonly message: string;
    public readonly timestamp: Date;
    public readonly isRead: boolean;

    constructor(message: IMessage) {
        this._id = message._id.toString();
        this.chatId = message.chatId;
        this.senderId = message.senderId;
        this.receiverId = message.receiverId;
        this.message = message.message;
        this.timestamp = message.timestamp;
        this.isRead = message.isRead;
    }

    public static from(message: IMessage): MessageDto {
        return new MessageDto(message);
    }

    public static fromList(messages: IMessage[]): MessageDto[] {
        return messages.map(msg => new MessageDto(msg));
    }
}
