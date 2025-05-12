import { Request, Response } from "express";
export interface INotificationController {
    getNotifications(req: Request, res: Response): Promise<void>;
    sendNotification(req: Request, res: Response): Promise<void>;
    getUnreadNotificationsCount(req: Request, res: Response): Promise<void>;
    markNotificationAsRead(req: Request, res: Response): Promise<void>;
    markAllAsRead(req: Request, res: Response): Promise<void>;
}

