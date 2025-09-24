import { Router } from "express";
import { NotificationController } from "../controllers/notifictionController";
import {NotificationService} from "../services/notificationService";
import notificationRepository from "../repositories/notificationRepository";

const router = Router();

const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

router.get('/', notificationController.getNotifications.bind(notificationController));
router.post('/', notificationController.sendNotification.bind(notificationController));
router.get('/unread/count', notificationController.getUnreadNotificationsCount.bind(notificationController));
router.patch('/read',notificationController.markAllAsRead.bind(notificationController));
router.patch('/read/:notificationId',notificationController.markNotificationAsRead.bind(notificationController));

export default router;  