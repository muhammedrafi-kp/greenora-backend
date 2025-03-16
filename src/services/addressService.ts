import { IAddressRepository } from "../interfaces/address/IAddressRepository";
import { IAddressService } from "../interfaces/address/IAddressService";
import { IAddress } from "../models/Address";

export class AddressService implements IAddressService {
    constructor(private addressRepository: IAddressRepository) { };

    async createAddress(addressData: IAddress): Promise<IAddress> {
        try {
            return await this.addressRepository.create(addressData);
        } catch (error) {
            console.error('Error while creating address:', error);
            throw error;
        }
    }

    // async getAddresses(query: object): Promise<IAddress[] | null> {
    //     try {
    //         return await this.addressRepository.find(query);
    //     } catch (error) {
    //         console.error('Error while finding addresses:', error);
    //         throw error;
    //     }
    // }

    // async getAddresses(userId: object): Promise<IAddress[] | null> {
    //     try {
    //         return await this.addressRepository.getAddressesByUserId();
    //     } catch (error) {
    //         console.error('Error while finding addresses:', error);
    //         throw error;
    //     }
    // }

    async getAddresses(userId: string): Promise<IAddress[] | null> {
        try {
            return await this.addressRepository.find({ userId });
        } catch (error) {
            console.error('Error while finding addresses:', error);
            throw error;
        }
    }

    async updateAddress(addressId: string, addressData: Partial<IAddress>): Promise<IAddress | null> {
        try {
            return await this.addressRepository.updateById(addressId, addressData);
        } catch (error) {
            console.error('Error while updating address:', error);
            throw error;
        }
    }

    async deleteAddress(addressId: string): Promise<IAddress | null> {
        try {
            return await this.addressRepository.deleteById(addressId);
        } catch (error) {
            console.error('Error while deleting address:', error);
            throw error;
        }
    }
}