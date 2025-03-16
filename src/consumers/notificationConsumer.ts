import amqp from "amqplib";

async function startNotificationConsumer() {
    try {
        const connection = await amqp.connect("amqp://localhost");
        const channel = await connection.createChannel();
        const queue = "notifications";

        await channel.assertQueue(queue, { durable: true });

        console.log("Waiting for notification messages...");

        channel.consume(queue, async (message) => {
            if (message) {
                try {
                    // Parse the message
                    const notification = JSON.parse(message.content.toString());
                    console.log("Received notification:", notification);

                    // Step 5: Acknowledge the message (mark as processed)
                    channel.ack(message);
                } catch (error) {
                    console.error("Failed to process notification:", error);

                    // Step 6: Requeue the message for retry
                    channel.nack(message);
                }
            }
        }, { noAck: false });
        
    } catch (error) {
        console.error("Error in notification consumer:", error);
    }
}

export default startNotificationConsumer;
