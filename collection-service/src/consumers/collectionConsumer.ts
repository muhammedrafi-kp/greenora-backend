import { ICollection } from "../models/Collection";
import RabbitMQ from "../utils/rabbitmq";
import { CollectionService } from "../services/collectionService";
import collectionRepository from "../repositories/collectionRepository";
import categoryRepository from "../repositories/categoryRepository";
import redisRepository from "../repositories/redisRepository";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";

const collectionService: ICollectionservice = new CollectionService(collectionRepository, categoryRepository, redisRepository);


export default class CollectionConsumer {
    static async initialize() {
        await RabbitMQ.connect();

        RabbitMQ.consume("rollback.cancellation", async (message) => {
            try {
                console.log("Rollback triggered for Collection ID:", message.collectionId);
                // await Collection.updateOne(
                //     { collectionId: message.collectionId },
                //     { status: "scheduled" }
                // );
            } catch (error) {
                console.error("Error during rollback", error);
            }
        });


    }
}
