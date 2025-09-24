import { IChatRepository } from "../interfaces/IChatRepository";
import { Message, IMessage } from "../models/Chat";
import { BaseRepository } from "./baseRepository";
import { IMessageRepository } from "../interfaces/IMessageRepository";


class MessageRepository extends BaseRepository<IMessage> implements IMessageRepository {
    constructor() {
        super(Message);
    }
}

export default new MessageRepository();