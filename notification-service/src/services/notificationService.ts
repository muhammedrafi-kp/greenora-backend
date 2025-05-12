import { INotificationRepository } from "../interfaces/INotificationRepository";
import { INotificationService } from "../interfaces/INotificationService";
import { INotification } from "../models/Notification";
import { io } from "../index";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


export class NotificationService implements INotificationService {

    constructor(private readonly notificationRepository: INotificationRepository) { };

    async getNotifications(userId: string, limit: number, skip: number): Promise<INotification[]> {
        try {
            const notifications = await this.notificationRepository.find({ userId }, {}, { limit, skip, sort: { createdAt: -1 } });
            return notifications;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async createNotification(notificationData: INotification): Promise<void> {
        try {
            await this.notificationRepository.create(notificationData);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async sendNotification(notificationData: INotification): Promise<void> {
        try {
            const { userId } = notificationData;

            io.to(userId).emit("receive-notification", notificationData);

            await this.notificationRepository.create(notificationData);
        } catch (error) {
            console.log(error);
        }

    }

    async getUnreadNotificationsCount(userId: string): Promise<number> {
        try {
            const count = await this.notificationRepository.count({ userId, isRead: false });
            return count;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            const response = await this.notificationRepository.updateById(notificationId, { isRead: true });
            if (!response) {
                throw new Error('Notification not found');
                const error: any = new Error(MESSAGES.NOTIFICATION_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async markAllAsRead(): Promise<void> {
        try {
            await this.notificationRepository.updateMany({ isRead: false }, { isRead: true });
        } catch (error) {
            throw error;
        }
    }
}
