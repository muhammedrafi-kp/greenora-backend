import { Router } from "express";
import { CollcetorController } from "../controllers/collectorController";
import { CollectorService } from "../services/collectorService";
import collectorRepository from "../repositories/collectorRepository";
import redisRepository from "../repositories/redisRepository";
import { validateCollector } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";
import {
    LoginDto,
    SignupDto,
    VerifyOtpDto,
    ResendOtpDto,
    ResetPasswordDto,
    SendResetPasswordLinkDto,
    GoogleAuthCallbackDto
} from "../dtos/request/auth.dto";

import multer from 'multer';
const upload = multer();

const collectorService = new CollectorService(collectorRepository, redisRepository);
const collectorController = new CollcetorController(collectorService);

const router = Router();

router.post('/login', validateDto(LoginDto), collectorController.login.bind(collectorController));
router.post('/signup',validateDto(SignupDto), collectorController.signUp.bind(collectorController));
router.post('/verify-otp',validateDto(VerifyOtpDto), collectorController.verifyOtp.bind(collectorController));
router.post('/resend-otp',validateDto(ResendOtpDto), collectorController.resendOtp.bind(collectorController));
router.post('/forget-password',validateDto(SendResetPasswordLinkDto), collectorController.sendResetPasswordLink.bind(collectorController));
router.patch('/reset-password',validateDto(SendResetPasswordLinkDto), collectorController.resetPassword.bind(collectorController));
router.post('/refresh-token', collectorController.validateRefreshToken.bind(collectorController));
router.post('/google/callback',validateDto(GoogleAuthCallbackDto), collectorController.googleAuthCallback.bind(collectorController));

router.get('/is-blocked/:clientId', collectorController.getCollectorBlockedStatus.bind(collectorController));

router.get('/', validateCollector, collectorController.getCollector.bind(collectorController));
router.post('/collectors/batch', collectorController.getCollectors.bind(collectorController));
router.put('/', validateCollector, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idProofFront', maxCount: 1 },
    { name: 'idProofBack', maxCount: 1 }]),
    collectorController.updateCollector.bind(collectorController)
);
router.patch('/password', validateCollector, collectorController.changePassword.bind(collectorController));

router.post('/available-collector', collectorController.getAvailableCollector.bind(collectorController));

export default router;