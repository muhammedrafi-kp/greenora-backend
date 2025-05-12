import RabbitMQ from "../utils/rabbitmq";
import { UserService } from "../services/userService";
import { IUserService } from "../interfaces/user/IUserService";
import { ICollectorService } from "../interfaces/collector/ICollectorServices";
import { CollectorService } from "../services/collectorService";
import userRepository from "../repositories/userRepository";
import collectorRepository from "../repositories/collectorRepository";
import redisRepository from "../repositories/redisRepository";
import adminRepository from "../repositories/adminRepository";

const userService: IUserService = new UserService(userRepository, collectorRepository, adminRepository, redisRepository);
const collectorService: ICollectorService = new CollectorService(collectorRepository, redisRepository);

export default class UserConsumer {

    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("collection-cancelled-collector", async (msg) => {
            console.log("Received pickup.cancelled:", msg.content.toString());

            const message = JSON.parse(msg.content.toString());

            try {

                if (!message.collectorId) return;

                await collectorService.cancelCollection(message.collectionId, message.collectorId, message.preferredDate);

                console.log(`Collector ${message.collectorId} task count reduced`);

            } catch (error) {
                console.error("Error updating collector tasks, triggering rollback");
                await RabbitMQ.publish("rollback.cancellation", { collectionId: message.collectionId });
            }
        });

        await RabbitMQ.consume("finalPayment-user", async (msg) => {
            console.log("Received finalPayment:", msg.content.toString());

            const message = JSON.parse(msg.content.toString());

            try {

                if (!message.collectorId) return;

                await collectorService.cancelCollection(message.collectionId, message.collectorId, message.preferredDate);

                console.log(`Collector ${message.collectorId} task count reduced`);

            } catch (error) {
                console.error("Error updating collector tasks, triggering rollback");
                await RabbitMQ.publish("rollback.cancellation", { collectionId: message.collectionId });
            }
        });

        await RabbitMQ.consume("rollback.cancellation", async (msg) => {
            console.log("Received rollback.cancellation in User Service:", msg);
            // await userService.rollbackCollectorTask(message.collectorId);
        });
    }
}
