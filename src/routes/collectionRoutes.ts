import { Router } from "express";
import { CollectionController } from "../controllers/collectionController";
import { CollectionService } from "../services/collectionService";
import collectionRepository from "../repositories/collectionRepository";
import categoryRepository from "../repositories/categoryRepository";
import redisRepository from "../repositories/redisRepository";

const collectionService = new CollectionService(collectionRepository, categoryRepository,redisRepository);
const collectionController = new CollectionController(collectionService);

const router = Router();


router.post('/', collectionController.createCollectionRequest.bind(collectionController));
router.get('/history', collectionController.getCollectionHistory.bind(collectionController));
router.get('/histories', collectionController.getCollectionHistories.bind(collectionController));


export default router;