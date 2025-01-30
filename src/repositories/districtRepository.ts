import { BaseRepository } from "./baseRepository";
import District, { IDistrict } from "../models/District";
import { IDistrictRepository } from "../interfaces/IDistrictRepository";

class DistrictRepository extends BaseRepository<IDistrict> implements IDistrictRepository {
    constructor() {
        super(District);
    }


    async findDistrictByName(name: string): Promise<IDistrict | null> {
        try {
            return await this.findOne({ name });
        } catch (error) {
            throw new Error(`Error while finding distric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findAllDistricts(): Promise<IDistrict[]> {
        try {
            return await this.find()
        } catch (error) {
            throw new Error(`Error while finding districs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getDistrictsWithServiceAreas(): Promise<IDistrict[]> {
        try {
            // return this.model.aggregate([
            //     {
            //         // Match the service areas for the district based on districtId
            //         $lookup: {
            //             from: "serviceareas", // Ensure this is the correct collection name in MongoDB (case-sensitive)
            //             localField: "_id", // The _id of the district
            //             foreignField: "district", // The district field in the service area
            //             as: "serviceAreas", // Alias for the matched service areas
            //         },
            //     },
            //     {
            //         $project: {
            //             _id: 1,
            //             name: 1,
            //             serviceAreas: 1, // Keep the serviceAreas array from the lookup
            //         },
            //     },
            // ]);

            return this.model.aggregate([
                {
                  $match: {
                    isActive: true, // Filter only active districts
                  },
                },
                {
                  $lookup: {
                    from: "serviceareas",
                    localField: "_id",
                    foreignField: "district",
                    as: "serviceAreas",
                  },
                },
                {
                  $addFields: {
                    serviceAreas: {
                      $filter: {
                        input: "$serviceAreas",
                        as: "serviceArea",
                        cond: { $eq: ["$$serviceArea.isActive", true] }, // Filter active service areas
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    serviceAreas: 1,
                  },
                },
              ]);
        } catch (error) {
            throw new Error(`Error while aggregating district data with service areas: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    
    
}
export default new DistrictRepository();