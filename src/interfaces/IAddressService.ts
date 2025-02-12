import { IAddress } from "../models/Address";


export interface IAddressService {
    createAddress(addressData: IAddress): Promise<IAddress>;
    // getAddresses(query: object): Promise<IAddress[] | null>;
    getAddresses(userId: string): Promise<IAddress[] | null>;
    updateAddress(addressId: string, addressData: Partial<IAddress>): Promise<IAddress | null>;
    deleteAddress(addressId: string): Promise<IAddress | null>;
}