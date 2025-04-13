import { Router } from "express";
import { WalletController } from "../controllers/walletController";
import { WalletService } from "../services/walletService";
import walletRepository from "../repositories/walletRepository";

const walletService = new WalletService(walletRepository);
const walletController = new WalletController(walletService);

const router = Router();

router.get("/", walletController.getWalletData.bind(walletController));
router.post("/deposits/initiate", walletController.initiateDeposit.bind(walletController));
router.post("/deposits/verify", walletController.verifyDeposit.bind(walletController));
router.post("/withdrawals", walletController.withdrawMoney.bind(walletController));

export default router;