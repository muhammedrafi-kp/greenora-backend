import { Router } from 'express';

import { AdminController } from '../controllers/adminController';
import { AdminService } from '../services/adminService'
import adminRepository from '../repositories/adminRepository';
import userRepository from '../repositories/userRepository';
import collectorRepository from '../repositories/collectorRepository';
import { validateAdmin } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";
import { LoginDto, SignupDto, VerifyOtpDto, ResendOtpDto } from "../dtos/request/auth.dto";

const adminService = new AdminService(adminRepository, userRepository, collectorRepository);
const adminController = new AdminController(adminService);

const router = Router();

router.post('/login', validateDto(LoginDto), adminController.login.bind(adminController));
router.post('/signup', validateDto(SignupDto), adminController.createAdmin.bind(adminController));
router.post('/refresh-token', adminController.validateRefreshToken.bind(adminController));

router.get('/users', validateAdmin, adminController.getUsers.bind(adminController));
router.get('/collector/:collectorId', adminController.getCollector.bind(adminController));
router.get('/collectors', validateAdmin, adminController.getCollectors.bind(adminController));
router.get('/available-collectors', adminController.getAvailableCollectors.bind(adminController));
router.get('/verification-requests', validateAdmin, adminController.getVerificationRequests.bind(adminController));
router.patch('/verification-status/:id', validateAdmin, adminController.updateVerificationStatus.bind(adminController));
router.patch('/user-status/:id', validateAdmin, adminController.updateUserStatus.bind(adminController));
router.patch('/collector-status/:id', validateAdmin, adminController.updateCollectorStatus.bind(adminController));

export default router;