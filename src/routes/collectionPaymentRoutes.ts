import { Router } from "express";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { CollectionPaymentController } from "../controllers/collectionPaymentController";
import collectionPaymentRepository from "../repositories/collectionPaymentRepository";
import walletRepository from "../repositories/walletRepository";

const collectionPaymentService = new CollectionPaymentService(collectionPaymentRepository,walletRepository);
const collectionPaymentController = new CollectionPaymentController(collectionPaymentService);

const router = Router();

router.post("/initiate-advance-payment",collectionPaymentController.initiatePayment.bind(collectionPaymentController));
router.post("/advance-verification",collectionPaymentController.verifyAdvancePayment.bind(collectionPaymentController));
router.get("/:paymentId",collectionPaymentController.getPaymentData.bind(collectionPaymentController));
router.post("/payment-request",collectionPaymentController.requestPayment.bind(collectionPaymentController));
router.post("/verification",collectionPaymentController.verifyPayment.bind(collectionPaymentController));

export default router;