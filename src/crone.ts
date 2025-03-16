import cron from "node-cron";
import collectionRepository from "./repositories/collectionRepository";
import { CollectionService } from "./services/collectionService";
import { CollectionController } from "./controllers/collectionController";
import categoryRepository from "./repositories/categoryRepository";
import redisRepository from "./repositories/redisRepository";

const collectionService = new CollectionService(collectionRepository, categoryRepository, redisRepository);

// "0 0 * * *"
cron.schedule("*/5 * * * * *", async () => {
    try {
        await collectionService.processPendingRequests()
    } catch (error:any) {
        console.error("Error processing pending requests:", error.message);
    }
})
