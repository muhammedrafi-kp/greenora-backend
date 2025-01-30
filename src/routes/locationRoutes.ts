import { Router } from "express";
import districtRepository from "../repositories/districtRepository";
import serviceAreaRepository from "../repositories/serviceAreaRepository";
import { LocationService } from "../services/locationService";
import { LocationController } from "../controllers/locationController";


const locationService = new LocationService(districtRepository, serviceAreaRepository);
const locationController = new LocationController(locationService);

const router = Router();

router.post('/district/create-district', locationController.createDistrict.bind(locationController));
router.put('/district/update-district/:districtId',locationController.updateDistrict.bind(locationController));
router.put('/district/delete-district/:districtId',locationController.deleteDistrict.bind(locationController))
router.get('/district/districts-with-servic-areas', locationController.getDistrictsWithServiceAreas.bind(locationController));

export default router;

