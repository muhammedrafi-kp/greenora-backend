import { IChat } from "../../models/Chat";

export class ChatDto {
    public readonly _id: string;
    public readonly participant1: string;
    public readonly participant2: string;
    public readonly participant2Name: string | null;
    public readonly participant2ProfileUrl: string | null;
    public readonly lastMessage: string | null;
    public readonly participant1Role: 'admin';
    public readonly participant2Role: 'user' | 'collector';
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(chat: IChat) {
        this._id = chat._id.toString();
        this.participant1 = chat.participant1;
        this.participant2 = chat.participant2;
        this.participant2Name = chat.participant2Name || null;
        this.participant2ProfileUrl = chat.participant2ProfileUrl || null;
        this.lastMessage = chat.lastMessage || null;
        this.participant1Role = chat.participant1Role;
        this.participant2Role = chat.participant2Role;
        this.createdAt = chat.createdAt;
        this.updatedAt = chat.updatedAt;
    }

    public static from(chat: IChat): ChatDto {
        return new ChatDto(chat);
    }

    public static fromList(chats: IChat[]): ChatDto[] {
        return chats.map(chat => new ChatDto(chat));
    }
}

