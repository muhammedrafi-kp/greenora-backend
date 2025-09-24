import RabbitMQ from "../utils/rabbitmq";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { WalletService } from "../services/walletService";
import walletRepository from "../repositories/walletRepository";
import transactionRepository from "../repositories/transactionRepository";

const collectionPaymentService = new CollectionPaymentService(walletRepository, transactionRepository);
const walletService = new WalletService(walletRepository, transactionRepository);

export default class PaymnetConsumer {

    static async initialize() {
        await RabbitMQ.connect();

        await RabbitMQ.consume("collection-cancelled-payment", async (msg) => {
            console.log("Received pickup.cancelled:", msg.content.toString());

            const data: { userId: string, amount: number } = JSON.parse(msg.content.toString());

            try {

                await collectionPaymentService.refundCollectionAdvance(data.userId, data.amount);
                console.log("collection advance refunded");

            } catch (error) {
                console.error("Error updating collector tasks, triggering rollback");
                // await RabbitMQ.publish("rollback.cancellation", { collectionId: message.collectionId });
            }
        });

        await RabbitMQ.consume("user-created", async (msg) => {
            console.log("Received user-created:", msg.content.toString());

            const data: { userId: string } = JSON.parse(msg.content.toString());

            try {

                const wallet = await walletService.createWallet(data.userId);
                console.log("wallet created :",wallet);

            } catch (error) {
                RabbitMQ.nack(msg, false, false);
            }
        });


    }
}
