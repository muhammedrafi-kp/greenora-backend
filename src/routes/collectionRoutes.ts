import { Router } from "express";
import { CollectionController } from "../controllers/collectionController";
import { CollectionService } from "../services/collectionService";
import collectionRepository from "../repositories/collectionRepository";
import categoryRepository from "../repositories/categoryRepository";
import redisRepository from "../repositories/redisRepository";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const collectionService = new CollectionService(collectionRepository, categoryRepository, redisRepository);
const collectionController = new CollectionController(collectionService);

const router = Router();

router.get('/', collectionController.getCollectionHistory.bind(collectionController));
router.get('/collections', collectionController.getCollectionHistories.bind(collectionController));
router.post('/schedule/:collectionId', collectionController.scheduleCollectionManually.bind(collectionController));
router.get('/available-collectors/:serviceAreaId', collectionController.getAvailableCollectors.bind(collectionController));
router.get('/collector/assigned-collections',collectionController.getAssignedCollections.bind(collectionController));
router.patch('/:collectionId',upload.array('collectionProofs'), collectionController.completeCollection.bind(collectionController));
router.patch('/cancel',collectionController.cancelCollection.bind(collectionController));

router.post('/payment-request',upload.array('collectionProofs'), collectionController.requestCollectionPayment.bind(collectionController));

export default router;