import { Router } from "express";
import { CollcetorController } from "../controllers/collectorController";
import { CollectorService } from "../services/collectorService";
import collectorRepository from "../repositories/collectorRepository";
import redisRepository from "../repositories/redisRepository";
import multer from 'multer';
const upload = multer();

const collectorService = new CollectorService(collectorRepository, redisRepository);
const collectorController = new CollcetorController(collectorService);

const router = Router();

router.post('/login', collectorController.login.bind(collectorController));
router.post('/signup', collectorController.signUp.bind(collectorController));
router.post('/verify-otp', collectorController.verifyOtp.bind(collectorController));
router.post('/resend-otp', collectorController.resendOtp.bind(collectorController));
router.post('/refresh-token', collectorController.validateRefreshToken.bind(collectorController));

router.get('/profile', collectorController.getCollector.bind(collectorController));
router.put('/update-profile', upload.single('profileImage'), collectorController.updateCollector.bind(collectorController));

export default router;