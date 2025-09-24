import { BaseRepository } from "./baseRepository";
import { IAddress } from "../models/Address";
import { IAddressRepository } from "../interfaces/address/IAddressRepository";
import Address from "../models/Address";
import { Types } from "mongoose";

class AddressRepository extends BaseRepository<IAddress> implements IAddressRepository {
    constructor() {
        super(Address);
    }
}

export default new AddressRepository();