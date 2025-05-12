import { Router } from "express";
import addressRepository from "../repositories/addressRepository";
import { AddressService } from "../services/addressService";
import { AddressController } from "../controllers/addressController";

const addressService = new AddressService(addressRepository);
const addressController = new AddressController(addressService);

const router = Router();

router.post('/', addressController.createAddress.bind(addressController));
router.get('/addresses', addressController.getAddresses.bind(addressController));
router.put('/:addressId', addressController.updateAddress.bind(addressController));
router.delete('/:addressId',addressController.deleteAddress.bind(addressController));

export default router;
