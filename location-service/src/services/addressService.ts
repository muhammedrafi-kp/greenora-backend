import { IAddressRepository } from "../interfaces/address/IAddressRepository";
import { IAddressService } from "../interfaces/address/IAddressService";
import { IAddress } from "../models/Address";
import { AddressDto } from "../dtos/response/address.dto";

export class AddressService implements IAddressService {
    
    constructor(private _addressRepository: IAddressRepository) { };

    async createAddress(addressData: IAddress): Promise<AddressDto> {
        try {
            const address = await this._addressRepository.create(addressData);
            return AddressDto.from(address);
        } catch (error) {
            console.error('Error while creating address:', error);
            throw error;
        }
    }

    async getAddresses(userId: string): Promise<AddressDto[] | null> {
        try {
            const addresses = await this._addressRepository.find({ userId });
            return AddressDto.fromList(addresses);
        } catch (error) {
            console.error('Error while finding addresses:', error);
            throw error;
        }
    }

    async updateAddress(addressId: string, addressData: Partial<IAddress>): Promise<AddressDto | null> {
        try {
            const address = await this._addressRepository.updateById(addressId, addressData);
            return AddressDto.from(address!);
        } catch (error) {
            console.error('Error while updating address:', error);
            throw error;
        }
    }

    async deleteAddress(addressId: string): Promise<AddressDto | null> {
        try {
            const address = await this._addressRepository.deleteById(addressId);
            return AddressDto.from(address!);
        } catch (error) {
            console.error('Error while deleting address:', error);
            throw error;
        }
    }
}