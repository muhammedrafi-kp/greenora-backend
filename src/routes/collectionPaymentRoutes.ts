import { Router } from "express";
import collectionPaymentRepository from "../repositories/collectionPaymentRepository";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { CollectionPaymentController } from "../controllers/collectionPaymentController";

const collectionPaymentService = new CollectionPaymentService(collectionPaymentRepository);
const collectionPaymentController = new CollectionPaymentController(collectionPaymentService);

const router = Router();

router.post("/initiate-payment",collectionPaymentController.initiatePayment.bind(collectionPaymentController));
router.post("/verify-payment",collectionPaymentController.verifyPayment.bind(collectionPaymentController));
router.get("/:paymentId",collectionPaymentController.getPaymentData.bind(collectionPaymentController));

export default router;