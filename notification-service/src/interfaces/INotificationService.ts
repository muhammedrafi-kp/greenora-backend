
import { INotification } from "../models/Notification";

export interface INotificationService {
    getNotifications(userId: string, limit: number, skip: number): Promise<INotification[]>;
    createNotification(notificationData:INotification): Promise<void>;
    sendNotification(notificationData:INotification): Promise<void>;
    getUnreadNotificationsCount(userId: string): Promise<number>;
    markNotificationAsRead(notificationId:string):Promise<void>;
    markAllAsRead():Promise<void>;
}
