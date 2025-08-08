import { Router } from "express";
import multer from 'multer';

import { UserController } from "../controllers/userController";
import { UserService } from "../services/userService";
import userRepository from "../repositories/userRepository";
import collectorRepository from "../repositories/collectorRepository";
import adminRepository from "../repositories/adminRepository";
import redisRepository from "../repositories/redisRepository";
import { validateUser } from "../middlewares/auth";
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


const storage = multer.memoryStorage();
const upload = multer({ storage });

const userService = new UserService(userRepository, collectorRepository, adminRepository, redisRepository);
const userController = new UserController(userService);


const router = Router();

router.post('/login', validateDto(LoginDto), userController.login.bind(userController));
router.post('/signup', validateDto(SignupDto), userController.signUp.bind(userController));
router.post('/otp/verify', validateDto(VerifyOtpDto), userController.verifyOtp.bind(userController));
router.post('/otp/resend', validateDto(ResendOtpDto), userController.resendOtp.bind(userController));
router.post('/password-reset', validateDto(SendResetPasswordLinkDto), userController.sendResetPasswordLink.bind(userController));
router.patch('/password-reset', validateDto(ResetPasswordDto), userController.resetPassword.bind(userController));
router.post('/refresh-token', userController.validateRefreshToken.bind(userController));
router.get('/blocked-status/:clientId', userController.getUserBlockedStatus.bind(userController));
router.post('/logout', userController.logout.bind(userController));
router.post('/google/callback', validateDto(GoogleAuthCallbackDto), userController.googleAuthCallback.bind(userController));

router.get('/me', validateUser, userController.getUser.bind(userController));
router.put('/me', validateUser, upload.single('profileImage'), userController.updateUser.bind(userController));
router.post('/batch', userController.getUsers.bind(userController));
router.patch('/me/profile-image', validateUser, upload.single('profileImage'), userController.uploadProfileImage.bind(userController));
router.patch('/me/password', validateUser, userController.changePassword.bind(userController));
router.get('/collector/:collectorId', userController.getCollector.bind(userController));
router.get('/admin', userController.getAdmin.bind(userController));


export default router;