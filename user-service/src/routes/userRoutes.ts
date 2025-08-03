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
router.post('/verify-otp', validateDto(VerifyOtpDto), userController.verifyOtp.bind(userController));
router.post('/resend-otp', validateDto(ResendOtpDto), userController.resendOtp.bind(userController));
router.post('/forget-password', validateDto(SendResetPasswordLinkDto), userController.sendResetPasswordLink.bind(userController));
router.patch('/reset-password', validateDto(ResetPasswordDto), userController.resetPassword.bind(userController));
router.post('/refresh-token', userController.validateRefreshToken.bind(userController));
router.get('/blocked-status/:clientId', userController.getUserBlockedStatus.bind(userController));
router.post('/logout', userController.logout.bind(userController));
router.post('/google/callback', validateDto(GoogleAuthCallbackDto), userController.googleAuthCallback.bind(userController));

router.get('/', validateUser, userController.getUser.bind(userController));
router.put('/', validateUser, upload.single('profileImage'), userController.updateUser.bind(userController));
router.post('/users/batch', userController.getUsers.bind(userController));
router.patch('/upload-profile-image', validateUser, upload.single('profileImage'), userController.uploadProfileImage.bind(userController));
router.patch('/password', validateUser, userController.changePassword.bind(userController));
router.get('/collector/:collectorId', userController.getCollector.bind(userController));
router.get('/admin', userController.getAdmin.bind(userController));


export default router;