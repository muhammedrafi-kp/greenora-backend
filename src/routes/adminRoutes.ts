import { Router } from 'express';

import { AdminController } from '../controllers/adminController';
import { AdminService } from '../services/adminService'
import adminRepository from '../repositories/adminRepository';
import userRepository from '../repositories/userRepository';
import collectorRepository from '../repositories/collectorRepository';

const adminService = new AdminService(adminRepository, userRepository, collectorRepository);
const adminController = new AdminController(adminService);

const router = Router();

router.post('/login', adminController.login.bind(adminController));
router.post('/signup', adminController.createAdmin.bind(adminController));
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/collectors', adminController.getCollectors.bind(adminController));
router.patch('/update-user-status/:id', adminController.updateUserStatus.bind(adminController));
router.patch('/update-collector-status/:id', adminController.updateCollectorStatus.bind(adminController));

export default router;