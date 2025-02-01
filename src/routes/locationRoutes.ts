import { Router } from "express";
import districtRepository from "../repositories/districtRepository";
import serviceAreaRepository from "../repositories/serviceAreaRepository";
import { LocationService } from "../services/locationService";
import { LocationController } from "../controllers/locationController";


const locationService = new LocationService(districtRepository, serviceAreaRepository);
const locationController = new LocationController(locationService);

const router = Router();

router.post('/admin/create-district', locationController.createDistrict.bind(locationController));
router.put('/admin/update-district/:districtId',locationController.updateDistrict.bind(locationController));
router.put('/admin/delete-district/:districtId',locationController.deleteDistrict.bind(locationController))
router.get('/admin/districts-with-servic-areas', locationController.getDistrictsWithServiceAreas.bind(locationController));

router.post('/admin/create-service-area', locationController.createServiceArea.bind(locationController));
router.put('/admin/update-service-area/:serviceAreaId', locationController.updateServiceArea.bind(locationController));

export default router;

