import { INotification } from "../../models/Notification";

export class NotificationDto {
    public readonly _id: string;
    public readonly userId: string;
    public readonly title: string;
    public readonly message: string;
    public readonly url?: string;
    public readonly isRead: boolean;
    public readonly createdAt: Date;

    constructor(notification: INotification) {
        this._id = notification._id.toString();
        this.userId = notification.userId;
        this.title = notification.title;
        this.message = notification.message;
        this.url = notification.url;
        this.isRead = notification.isRead;
        this.createdAt = notification.createdAt;
    }

    public static from(notification: INotification): NotificationDto {
        return new NotificationDto(notification);
    }

    public static fromList(notifications: INotification[]): NotificationDto[] {
        return notifications.map(n => new NotificationDto(n));
    }
}
