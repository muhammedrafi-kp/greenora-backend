import { Router } from "express";
import { CollectionPaymentService } from "../services/collectionPaymentService";
import { CollectionPaymentController } from "../controllers/collectionPaymentController";
import walletRepository from "../repositories/walletRepository";
import transactionRepository from "../repositories/transactionRepository";

const collectionPaymentService = new CollectionPaymentService(walletRepository, transactionRepository);
const collectionPaymentController = new CollectionPaymentController(collectionPaymentService);

const router = Router();

router.post("/order", collectionPaymentController.createOrder.bind(collectionPaymentController));
router.post("/verification", collectionPaymentController.verifyPayment.bind(collectionPaymentController));
router.post("/wallet", collectionPaymentController.payWithWallet.bind(collectionPaymentController));

export default router;