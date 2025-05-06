import { Router } from "express";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { CollectionPaymentController } from "../controllers/collectionPaymentController";
import collectionPaymentRepository from "../repositories/collectionPaymentRepository";
import walletRepository from "../repositories/walletRepository";

const collectionPaymentService = new CollectionPaymentService(collectionPaymentRepository,walletRepository);
const collectionPaymentController = new CollectionPaymentController(collectionPaymentService);

const router = Router();

router.post("/order",collectionPaymentController.createOrder.bind(collectionPaymentController));
router.post("/verification",collectionPaymentController.verifyPayment.bind(collectionPaymentController));
router.post("/wallet",collectionPaymentController.payWithWallet.bind(collectionPaymentController));

router.get("/:paymentId",collectionPaymentController.getPaymentData.bind(collectionPaymentController));

export default router;