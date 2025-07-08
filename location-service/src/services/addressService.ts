import { IAddressRepository } from "../interfaces/address/IAddressRepository";
import { IAddressService } from "../interfaces/address/IAddressService";
import { IAddress } from "../models/Address";

export class AddressService implements IAddressService {
    constructor(private _addressRepository: IAddressRepository) { };

    async createAddress(addressData: IAddress): Promise<IAddress> {
        try {
            return await this._addressRepository.create(addressData);
        } catch (error) {
            console.error('Error while creating address:', error);
            throw error;
        }
    }

    async getAddresses(userId: string): Promise<IAddress[] | null> {
        try {
            return await this._addressRepository.find({ userId });
        } catch (error) {
            console.error('Error while finding addresses:', error);
            throw error;
        }
    }

    async updateAddress(addressId: string, addressData: Partial<IAddress>): Promise<IAddress | null> {
        try {
            return await this._addressRepository.updateById(addressId, addressData);
        } catch (error) {
            console.error('Error while updating address:', error);
            throw error;
        }
    }

    async deleteAddress(addressId: string): Promise<IAddress | null> {
        try {
            return await this._addressRepository.deleteById(addressId);
        } catch (error) {
            console.error('Error while deleting address:', error);
            throw error;
        }
    }
}