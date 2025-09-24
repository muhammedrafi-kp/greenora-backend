import RabbitMQ from "../utils/rabbitmq";
import { io } from "../index";
import { CreateNotificationDto } from "../dtos/request/createNotification.dto";
import { NotificationService } from "../services/notificationService";
import notificationRepository from "../repositories/notificationRepository";
import { INotificationService } from "../interfaces/INotificationService";

const notificationService: INotificationService = new NotificationService(notificationRepository);

export default class NotificationConsumer {

    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("notification", async (msg) => {
            console.log("Received notification:", msg.content.toString());

            const notificationData: CreateNotificationDto = JSON.parse(msg.content.toString());

            console.log(notificationData)

            try {

                const notification = await notificationService.createNotification(notificationData);
                console.log("newNotification :", notification);

                io.to(notification.userId).emit("receive-notification", notification);

            } catch (error) {
                RabbitMQ.nack(msg, false, false);
            }
        });
    }
}
