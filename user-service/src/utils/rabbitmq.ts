import amqp from "amqplib";

class RabbitMQ {
    private static channel: amqp.Channel;

    static async connect() {
        const connection = await amqp.connect(process.env.RABBITMQ_URL as string);
        this.channel = await connection.createChannel();

        console.log("RabbitMQ connected ✅ waiting for messages...");
    }

    static async publish(queue: string, message: object) {
        if (!this.channel) {
            throw new Error("RabbitMQ channel is not initialized. Call connect() first.");
        }
        await this.channel.assertQueue(queue, { durable: true });
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)),{ persistent: true });
        console.log("Event published to:", queue);
    }

    static async consume(queue: string, callback: (message: any) => void) {

        if (!this.channel) {
            throw new Error("RabbitMQ channel is not initialized. Call connect() first.");
        }
        await this.channel.assertQueue(queue, { durable: true });
        this.channel.consume(queue, (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    callback(msg);
                    this.channel?.ack(msg);
                } catch (error) {
                    console.error(`Error processing message from ${queue}:`, error);
                    this.channel?.nack(msg, false, false);
                }
            }
        });
    }

    static async nack(message: amqp.Message, requeue: boolean, multiple: boolean) {
        if (!this.channel) {
            throw new Error("RabbitMQ channel is not initialized. Call connect() first.");
        }
        this.channel.nack(message, multiple, requeue);
    }
}

export default RabbitMQ;
