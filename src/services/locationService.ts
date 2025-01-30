import { IDistrictRepository } from "../interfaces/IDistrictRepository";
import { ILocationService } from "../interfaces/ILocationService";
import { IServiceAreaRepository } from "../interfaces/IServiceAreaRepository";
import { IDistrict } from "../models/District";
import { IServiceArea } from "../models/ServiceArea";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";


export class LocationService implements ILocationService {
    constructor(
        private districtRepository: IDistrictRepository,
        private serviceAreaRepository: IServiceAreaRepository
    ) { };

    async createDistrict(districtName: string): Promise<IDistrict> {
        try {
            return await this.districtRepository.create({name:districtName});
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async updateDistrict(districtId: string, districtName: string): Promise<IDistrict | null> {
        try {
            return await this.districtRepository.updateById(districtId, {name:districtName});
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
            return await this.serviceAreaRepository.createServiceArea(serviceAreaData);
        } catch (error) {
            console.error('Error while creating ServiceArea:', error);
            throw error;
        }
    }

    async findDistricts(): Promise<IDistrict[]> {
        try {
            return await this.districtRepository.findAllDistricts();
        } catch (error) {
            console.error('Error while finding district:', error);
            throw error;
        }
    }

    async findServiceAreas(districtId: string): Promise<IServiceArea[]> {
        try {
            return await this.serviceAreaRepository.findAllServiceAreas();
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
}