import { INotificationRepository } from "../interfaces/INotificationRepository";
import { INotificationService } from "../interfaces/INotificationService";
import { NotificationDto } from "../dtos/response/notification.dto";
import { CreateNotificationDto } from "../dtos/request/createNotification.dto";
import { io } from "../index";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


export class NotificationService implements INotificationService {

    constructor(private readonly _notificationRepository: INotificationRepository) { };

    async getNotifications(userId: string, limit: number, skip: number): Promise<NotificationDto[]> {
        try {
            const notifications = await this._notificationRepository.find({ userId }, {}, { limit, skip, sort: { createdAt: -1 } });
            return NotificationDto.fromList(notifications);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async createNotification(notificationData: CreateNotificationDto): Promise<NotificationDto> {
        try {
            const notification = await this._notificationRepository.create(notificationData);
            return NotificationDto.from(notification);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async sendNotification(notificationData: CreateNotificationDto): Promise<NotificationDto> {
        try {
            const { userId } = notificationData;
            const notification = await this._notificationRepository.create(notificationData);
            io.to(userId).emit("receive-notification", notification);
            return NotificationDto.from(notification);
        } catch (error: any) {
            console.log("Error :", error.message);
            throw error;
        }
    }

    async getUnreadNotificationsCount(userId: string): Promise<number> {
        try {
            const count = await this._notificationRepository.count({ userId, isRead: false });
            return count || 0;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        try {
            const response = await this._notificationRepository.updateById(notificationId, { isRead: true });
            if (!response) {
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
            await this._notificationRepository.updateMany({ isRead: false }, { isRead: true });
        } catch (error) {
            throw error;
        }
    }
}
