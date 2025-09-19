import { IAddress } from "../../models/Address";

export class AddressDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly mobile: string;
    public readonly pinCode: string;
    public readonly locality: string;
    public readonly addressLine: string;

    constructor(address: IAddress) {
        this._id = address._id.toString();
        this.name = address.name;
        this.mobile = address.mobile;
        this.pinCode = address.pinCode;
        this.locality = address.locality;
        this.addressLine = address.addressLine;
    }

    public static from(address: IAddress): AddressDto {
        return new AddressDto(address);
    }

    public static fromList(addresses: IAddress[]): AddressDto[] {
        return addresses.map(address => new AddressDto(address));
    }
}
