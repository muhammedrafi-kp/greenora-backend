import { Router } from "express";
import districtRepository from "../repositories/districtRepository";
import serviceAreaRepository from "../repositories/serviceAreaRepository";
import { ServiceAreaService } from "../services/serviceAreaService";
import { ServiceAreaController } from "../controllers/serviceAreaController";
import { IServiceAreaController } from "../interfaces/serviceArea/IServiceAreaController";


const serviceAreaService = new ServiceAreaService(districtRepository, serviceAreaRepository);
const serviceAreaController = new ServiceAreaController(serviceAreaService);

const router = Router();

const adminRouter = Router();

const userRouter = Router();

router.use('/admin', adminRouter);
router.use('/user', userRouter);

adminRouter.get('/districts/service-areas', serviceAreaController.getDistrictsWithServiceAreas.bind(serviceAreaController));
adminRouter.post('/district', serviceAreaController.createDistrict.bind(serviceAreaController));
adminRouter.put('/district/:districtId', serviceAreaController.updateDistrict.bind(serviceAreaController));
adminRouter.delete('/district/:districtId', serviceAreaController.deleteDistrict.bind(serviceAreaController));

adminRouter.post('/service-area', serviceAreaController.createServiceArea.bind(serviceAreaController));
adminRouter.put('/service-area/:serviceAreaId', serviceAreaController.updateServiceArea.bind(serviceAreaController));
adminRouter.get('/service-areas/bulk', serviceAreaController.getServiceAreasByIds.bind(serviceAreaController));
adminRouter.get('/districts/bulk', serviceAreaController.getDistrictsByIds.bind(serviceAreaController));

userRouter.get('/service-areas/:districtId', serviceAreaController.getServiceAreasByDistrict.bind(serviceAreaController));
userRouter.post('/check-pin-code', serviceAreaController.isServiceAvailable.bind(serviceAreaController));
userRouter.get('/districts', serviceAreaController.getDistricts.bind(serviceAreaController));
userRouter.get('/district/:districtId/service-area/:serviceAreaId', serviceAreaController.getDistrictWithServiceArea.bind(serviceAreaController));

export default router;

