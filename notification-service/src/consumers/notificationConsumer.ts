import RabbitMQ from "../utils/rabbitmq";
import { io } from "../index";
import { INotification } from "../models/Notification";
import { NotificationService } from "../services/notificationService";
import notificationRepository from "../repositories/notificationRepository";
import { INotificationService } from "../interfaces/INotificationService";

const notificationService: INotificationService = new NotificationService(notificationRepository);

export default class NotificationConsumer {

    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("notification", async (msg) => {
            console.log("Received pickup.cancelled:", msg.content.toString());

            const notification: INotification = JSON.parse(msg.content.toString());

            console.log(notification)

            try {

                const newNotification = await notificationService.createNotification(notification);
                console.log("newNotification :",newNotification);

                io.to(notification.userId).emit("receive-notification", notification);

            } catch (error) {
                RabbitMQ.nack(msg, false, false);
            }
        });
    }
}
