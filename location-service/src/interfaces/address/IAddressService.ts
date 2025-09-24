import { IAddress } from "../../models/Address";
import {AddressDto} from "../../dtos/response/address.dto";

export interface IAddressService {
    createAddress(addressData: IAddress): Promise<AddressDto>;
    getAddresses(userId: string): Promise<AddressDto[] | null>;
    updateAddress(addressId: string, addressData: Partial<IAddress>): Promise<AddressDto | null>;
    deleteAddress(addressId: string): Promise<AddressDto | null>;
}