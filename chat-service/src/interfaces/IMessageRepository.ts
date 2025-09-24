import { IBaseRepository } from "./IBaseRepository";
import { IMessage } from "../models/Chat";

export interface IMessageRepository extends IBaseRepository<IMessage> { }