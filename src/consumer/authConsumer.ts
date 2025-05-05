import RabbitMQ from "../util/rabbitmq";
import { redis } from "../config/redisConfig";

export class AuthConsumer {
    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("blocked-status", async (msg) => {
            console.log("Received blocked-status:", msg.content.toString());
            const message = JSON.parse(msg.content.toString());
            await redis.set(`is-blocked:${message.clientId}`, message.isBlocked, 'EX', 3600);
        });

    }
}


