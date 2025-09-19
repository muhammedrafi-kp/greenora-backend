import { Router } from "express";
import { WalletController } from "../controllers/walletController";
import { WalletService } from "../services/walletService";
import walletRepository from "../repositories/walletRepository";
import transactionRepository from "../repositories/transactionRepository";

const walletService = new WalletService(walletRepository, transactionRepository);
const walletController = new WalletController(walletService);

const router = Router();

router.get("/", walletController.getWalletData.bind(walletController));
router.get("/transactions", walletController.getWalletWithTransactions.bind(walletController));
router.post("/deposits/initiate", walletController.initiateDeposit.bind(walletController));
router.post("/deposits/verification", walletController.verifyDeposit.bind(walletController));
router.post("/withdrawals", walletController.withdrawMoney.bind(walletController));

export default router;