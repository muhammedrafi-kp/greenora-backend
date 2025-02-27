import cron from "node-cron";
import collectionRepository from "./repositories/collectionRepository";
import { CollectionService } from "./services/collectionService";
import { CollectionController } from "./controllers/collectionController";
import categoryRepository from "./repositories/categoryRepository";
import redisRepository from "./repositories/redisRepository";

const collectionService = new CollectionService(collectionRepository,categoryRepository,redisRepository);

cron.schedule("0 0 * * *",async ()=>{
    try {
        await collectionService.processPendingRequests()
    } catch (error) {
        
    }
})

// cron.schedule("*/3 * * * * *",()=>{
//     console.log("Cron job running every 3 seconds: ", new Date().toLocaleString());
// })