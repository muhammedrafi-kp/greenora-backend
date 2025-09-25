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

router.get('/analytics/dashboard', collectionController.getDashboardData.bind(collectionController));
router.get('/analytics/revenue', collectionController.getRevenueData.bind(collectionController));
router.get('/analytics/graph', collectionController.getCollectionChartData.bind(collectionController));
router.get('/analytics/collector/dashboard', collectionController.getCollectorDashboardData.bind(collectionController));
router.get('/analytics/collector/revenue', collectionController.getCollectorRevenueData.bind(collectionController));
router.get('/analytics/collector/graph', collectionController.getCollectorCollectionChartData.bind(collectionController));

router.post("/payment/advance/razorpay-initiate", collectionController.initiateRazorpayAdvance.bind(collectionController));
router.post("/payment/advance/razorpay-verify", collectionController.verifyRazorpayAdvance.bind(collectionController));
router.post("/payment/advance/wallet", collectionController.payAdvanceWithWallet.bind(collectionController));
router.post("/payment/unlock", collectionController.unlockPaymentLock.bind(collectionController));

router.post('/payment-request', upload.array('collectionProofs'), collectionController.requestCollectionPayment.bind(collectionController));
router.post('/payment/razorpay-verify', collectionController.verifyRazorpayPayment.bind(collectionController));
router.post('/payment/wallet', collectionController.payWithWallet.bind(collectionController));

router.get('/me', collectionController.getCollectionHistory.bind(collectionController));
router.get('/', collectionController.getCollectionHistories.bind(collectionController));

router.post('/schedule/:collectionId', collectionController.scheduleCollectionManually.bind(collectionController));
router.get('/available-collectors/:serviceAreaId', collectionController.getAvailableCollectors.bind(collectionController));
router.get('/collector/assigned-collections', collectionController.getAssignedCollections.bind(collectionController));
router.patch('/:collectionId', upload.array('collectionProofs'), collectionController.completeCollection.bind(collectionController));
router.put('/cancel', collectionController.cancelCollection.bind(collectionController));



router.get('/:collectionId', collectionController.getCollection.bind(collectionController));


export default router;