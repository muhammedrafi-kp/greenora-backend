
import { NotificationDto } from "../dtos/response/notification.dto";
import { CreateNotificationDto } from "../dtos/request/createNotification.dto";

export interface INotificationService {
    getNotifications(userId: string, limit: number, skip: number): Promise<NotificationDto[]>;
    createNotification(notificationData: CreateNotificationDto): Promise<NotificationDto>;
    sendNotification(notificationData: CreateNotificationDto): Promise<NotificationDto>;
    getUnreadNotificationsCount(userId: string): Promise<number>;
    markNotificationAsRead(notificationId: string): Promise<void>;
    markAllAsRead(): Promise<void>;
}
