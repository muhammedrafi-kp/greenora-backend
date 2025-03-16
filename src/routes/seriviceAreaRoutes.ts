import { Router } from "express";
import districtRepository from "../repositories/districtRepository";
import serviceAreaRepository from "../repositories/serviceAreaRepository";
import { ServiceAreaService } from "../services/serviceAreaService";
import { ServiceAreaController } from "../controllers/serviceAreaController";


const serviceAreaService = new ServiceAreaService(districtRepository, serviceAreaRepository);
const serviceAreaController = new ServiceAreaController(serviceAreaService);

const router = Router();

router.post('/admin/create-district', serviceAreaController.createDistrict.bind(serviceAreaController));
router.put('/admin/update-district/:districtId', serviceAreaController.updateDistrict.bind(serviceAreaController));
router.put('/admin/delete-district/:districtId', serviceAreaController.deleteDistrict.bind(serviceAreaController))
router.get('/admin/districts-with-servic-areas', serviceAreaController.getDistrictsWithServiceAreas.bind(serviceAreaController));
router.post('/admin/create-service-area', serviceAreaController.createServiceArea.bind(serviceAreaController));
router.put('/admin/update-service-area/:serviceAreaId', serviceAreaController.updateServiceArea.bind(serviceAreaController));

router.get('/user/service-areas/:districtId', serviceAreaController.getServiceAreas.bind(serviceAreaController));
router.post('/user/check-pin-code', serviceAreaController.isServiceAvailable.bind(serviceAreaController));
router.get('/user/districts', serviceAreaController.getDistricts.bind(serviceAreaController));
router.get('/user/district/:districtId/service-area/:serviceAreaId', serviceAreaController.getDistrictWithServiceArea.bind(serviceAreaController));

export default router;

