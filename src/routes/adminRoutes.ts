import { Router } from 'express';

import { AdminController } from '../controllers/adminController';
import { AdminService } from '../services/adminService'
import adminRepository from '../repositories/adminRepository';

const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

const router = Router();

router.post('/login', adminController.login.bind(adminController));
router.post('/signup', adminController.createAdmin.bind(adminController));

export default router;