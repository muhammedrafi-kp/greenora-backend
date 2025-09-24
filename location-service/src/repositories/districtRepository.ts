import { BaseRepository } from "./baseRepository";
import District, { IDistrict } from "../models/District";
import { IServiceArea } from "../models/ServiceArea";
import { IDistrictRepository } from "../interfaces/serviceArea/IDistrictRepository";

class DistrictRepository extends BaseRepository<IDistrict> implements IDistrictRepository {
  constructor() {
    super(District);
  }

  async getDistrictsWithServiceAreas(): Promise<(IDistrict & { serviceAreas: IServiceArea[] })[]> {
    try {
      return this.model.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "serviceareas",
            localField: "_id",
            foreignField: "districtId",
            as: "serviceAreas",
          },
        },
        {
          $addFields: {
            serviceAreas: {
              $filter: {
                input: "$serviceAreas",
                as: "serviceArea",
                cond: { $eq: ["$$serviceArea.isActive", true] },
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
      ]) as unknown as (IDistrict & { serviceAreas: IServiceArea[] })[];
    } catch (error) {
      throw new Error(`Error while aggregating district data with service areas: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
}
export default new DistrictRepository();