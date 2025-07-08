import { INotificationController } from "../interfaces/INotificationController";
import { INotificationService } from "../interfaces/INotificationService";
import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


export class NotificationController implements INotificationController {
    constructor(private readonly _notificationService: INotificationService) { }

    async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = 10; // Number of notifications per page
            const skip = (page - 1) * limit;

            const notifications = await this._notificationService.getNotifications(userId, limit, skip);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.NOTIFICATIONS_FETCHED,
                data: notifications,
            });
        } catch (error) {
            console.log(error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Failed to fetch notifications');
        }
    }

    async sendNotification(req: Request, res: Response): Promise<void> {
        try {
            const notification = req.body;

            await this._notificationService.sendNotification(notification);
            res.status(200).send('Notification sent');
        } catch (error) {
            console.log(error);
            res.status(500).send('Notification failed');
        }
    }

    async getUnreadNotificationsCount(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const count = await this._notificationService.getUnreadNotificationsCount(userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.UNREAD_NOTIFICATIONS_COUNT_FETCHED,
                data: count,
            });
        } catch (error) {
            console.log(error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Failed to fetch unread notifications count');
        }
    }

    async markNotificationAsRead(req: Request, res: Response): Promise<void> {
        try {
            const { notificationId } = req.params;

            if (!notificationId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.INVALID_INPUT,
                });
                return;
            }

            await this._notificationService.markNotificationAsRead(notificationId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.MARKED_AS_READ,
            });
        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            console.log(error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
        }
    }

    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            await this._notificationService.markAllAsRead();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.ALL_MARKED_AS_READ,
            });

        } catch (error: any) {
            console.log(error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
        }
    }
}

