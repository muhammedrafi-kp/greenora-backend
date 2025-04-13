import { BaseRepository } from "./baseRepository";
import { INotification, Notification } from "../models/Notification";

class NotificationRepository extends BaseRepository<INotification> {
    constructor() {
        super(Notification);
    }
}

export default new NotificationRepository();
