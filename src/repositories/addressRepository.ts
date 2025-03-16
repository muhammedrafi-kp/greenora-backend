import { BaseRepository } from "./baseRepository";
import { IAddress } from "../models/Address";
import { IAddressRepository } from "../interfaces/address/IAddressRepository";
import Address from "../models/Address";
import { Types } from "mongoose";

class AddressRepository extends BaseRepository<IAddress> implements IAddressRepository {
    constructor() {
        super(Address);
    }

    // async getAddressesByUserId(userId: string): Promise<IAddress[] | null> {
    //     try {

    //         return await this.model.aggregate([
    //             { $match: { userId: new Types.ObjectId(userId) } },
    //             {
    //                 $lookup: {
    //                     from: 'districts',
    //                     localField: 'districtId',
    //                     foreignField: '_id',
    //                     as: 'district'
    //                 }
    //             },
    //             { $unwind: '$district' },
    //             {
    //                 $lookup: {
    //                     from: 'serviceareas',
    //                     localField: 'serviceAreaId',
    //                     foreignField: '_id',
    //                     as: 'serviceArea'
    //                 }
    //             },
    //             { $unwind: '$serviceArea' },
    //             {
    //                 $project: {
    //                     name: 1,
    //                     addressLine: 1,
    //                     locality: 1,
    //                     pinCode: 1,
    //                     mobile: 1,
    //                     district: '$district.name',
    //                     serviceArea: '$serviceArea.name'
    //                 }
    //             }
    //         ]) 
    //         // Execute the aggregation pipeline

    //     } catch (error) {
    //         throw new Error(`Error while finding addresses: ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }
}

export default new AddressRepository();