import {CreateAddressDto} from "../../dtos/request/address.dto";
import {AddressDto} from "../../dtos/response/address.dto";

export interface IAddressService {
    createAddress(addressData: CreateAddressDto): Promise<AddressDto>;
    getAddresses(userId: string): Promise<AddressDto[] | null>;
    updateAddress(addressId: string, addressData: CreateAddressDto): Promise<AddressDto | null>;
    deleteAddress(addressId: string): Promise<AddressDto | null>;
}