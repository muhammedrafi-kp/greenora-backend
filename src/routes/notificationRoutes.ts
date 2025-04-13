import { Router } from "express";
import { NotificationController } from "../controllers/notifictionController";
import {NotificationService} from "../services/notificationService";
import notificationRepository from "../repositories/notificationRepository";

const router = Router();

const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

router.get('/notifications', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', notificationController.getUnreadNotificationsCount.bind(notificationController));
router.patch('/read/:notificationId',notificationController.markNotificationAsRead.bind(notificationController));
router.patch('/read-all',notificationController.markAllAsRead.bind(notificationController));
router.post('/', notificationController.sendNotification.bind(notificationController));

export default router;  