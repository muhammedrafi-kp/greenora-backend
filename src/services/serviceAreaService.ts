import { IDistrictRepository } from "../interfaces/serviceArea/IDistrictRepository";
import { IServiceAreaService } from "../interfaces/serviceArea/IServiceAreaService";
import { IServiceAreaRepository } from "../interfaces/serviceArea/IServiceAreaRepository";
import { IDistrict } from "../models/District";
import { IServiceArea } from "../models/ServiceArea";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";


export class ServiceAreaService implements IServiceAreaService {
    constructor(
        private districtRepository: IDistrictRepository,
        private serviceAreaRepository: IServiceAreaRepository
    ) { };

    async createDistrict(districtName: string): Promise<IDistrict> {
        try {
            return await this.districtRepository.create({ name: districtName });
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async updateDistrict(districtId: string, districtName: string): Promise<IDistrict | null> {
        try {
            return await this.districtRepository.updateById(districtId, { name: districtName });
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async deleteDistrict(districtId: string): Promise<IDistrict | null> {
        try {
            const district = await this.districtRepository.findById(districtId);
            if (!district) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }
            district.isActive = false;
            return await this.districtRepository.updateById(districtId, district);
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }


    async createServiceArea(serviceAreaData: IServiceArea): Promise<IServiceArea> {
        try {
            return await this.serviceAreaRepository.create(serviceAreaData);
        } catch (error) {
            console.error('Error while creating ServiceArea:', error);
            throw error;
        }
    }

    async getDistricts(query: object): Promise<IDistrict[]> {
        try {
            const projection = {
                _id: 1,
                name: 1
            }
            return await this.districtRepository.find(query, projection);
        } catch (error) {
            console.error('Error while finding district:', error);
            throw error;
        }
    }

    async getServiceAreas(districtId: string): Promise<IServiceArea[]> {
        try {
            const query: object = { districtId };
            const projection: Record<string, number> = {
                _id: 1,
                name: 1
            }
            return await this.serviceAreaRepository.find(query, projection);
        } catch (error) {
            console.error('Error while finding ServiceAreas:', error);
            throw error;
        }
    }

    async getDistrictsWithServiceAreas(): Promise<IDistrict[]> {
        try {
            return await this.districtRepository.getDistrictsWithServiceAreas();
        } catch (error) {
            console.error('Error while finding district with serviceAreas:', error);
            throw error;
        }
    }

    async isServiceAvailable(serviceAreaId: string, pincode: string): Promise<IServiceArea | null> {
        try {
            const query: object = {
                _id: serviceAreaId,
                postalCodes: { $in: [pincode] },
                isActive: true
            }

            return await this.serviceAreaRepository.findOne(query);

        } catch (error) {
            console.error('Error while checking availability:', error);
            throw error;
        }
    }

    async getDistrictWithServiceArea(districtId: string, serviceAreaId: string): Promise<{ district: IDistrict; serviceArea: IServiceArea; }> {
        try {

            const district = await this.districtRepository.findById(districtId);
            if (!district) {
                throw new Error(`District with ID ${districtId} not found`);
            }

            const serviceArea = await this.serviceAreaRepository.findById(serviceAreaId);
            if (!serviceArea) {
                throw new Error(`Service Area with ID ${serviceAreaId} not found`);
            }

            return { district, serviceArea };

        } catch (error) {
            console.error('Error while finding district with serviceArea:', error);
            throw error;
        }
    }
}