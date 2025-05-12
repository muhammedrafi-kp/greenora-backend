import { Router } from "express";
import { UserController } from "../controllers/userController";
import { UserService } from "../services/userService";
import userRepository from "../repositories/userRepository";
import collectorRepository from "../repositories/collectorRepository";
import adminRepository from "../repositories/adminRepository";
import redisRepository from "../repositories/redisRepository";
import { validateUser } from "../middlewares/auth";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const userService = new UserService(userRepository, collectorRepository, adminRepository, redisRepository);
const userController = new UserController(userService);


const router = Router();

router.post('/login', userController.login.bind(userController));
router.post('/signup', userController.signUp.bind(userController));
router.post('/verify-otp', userController.verifyOtp.bind(userController));
router.post('/resend-otp', userController.resendOtp.bind(userController));
router.post('/forget-password', userController.sendResetPasswordLink.bind(userController));
router.patch('/reset-password', userController.resetPassword.bind(userController));
router.post('/refresh-token', userController.validateRefreshToken.bind(userController));
router.get('/is-blocked/:clientId', userController.getUserBlockedStatus.bind(userController));

router.post('/google/callback', userController.googleAuthCallback.bind(userController));
router.get('/', validateUser, userController.getUser.bind(userController));
router.put('/', validateUser, upload.single('profileImage'), userController.updateUser.bind(userController));
router.post('/users/batch', userController.getUsers.bind(userController));
router.patch('/upload-profile-image', validateUser, upload.single('profileImage'), userController.uploadProfileImage.bind(userController));
router.patch('/password', validateUser, userController.changePassword.bind(userController));
router.get('/collector/:collectorId', userController.getCollector.bind(userController));
router.get('/admin', userController.getAdmin.bind(userController));


export default router;