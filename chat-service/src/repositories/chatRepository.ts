import { IChatRepository } from "../interfaces/IChatRepository";
import { Chat, IChat } from "../models/Chat";
import { BaseRepository } from "./baseRepository";


class ChatRepository extends BaseRepository<IChat> implements IChatRepository {
    constructor() {
        super(Chat);
    }
}

export default new ChatRepository();