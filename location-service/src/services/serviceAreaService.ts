import { IDistrictRepository } from "../interfaces/serviceArea/IDistrictRepository";
import { IServiceAreaService } from "../interfaces/serviceArea/IServiceAreaService";
import { IServiceAreaRepository } from "../interfaces/serviceArea/IServiceAreaRepository";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";
import { CreateAreaDto } from "../dtos/request/serviceArea.dto"
import { DistrictDto } from "../dtos/response/district.dto";
import { ServiceAreaDto } from "../dtos/response/serviceArea.dto";
import { DistrictWithAreasDto } from "../dtos/response/DistrictWithAreasDto.dto";
import { Types } from "mongoose"

export class ServiceAreaService implements IServiceAreaService {
    constructor(
        private _districtRepository: IDistrictRepository,
        private _serviceAreaRepository: IServiceAreaRepository
    ) { };

    async getDistricts(query: object): Promise<DistrictDto[]> {
        try {
            const districts = await this._districtRepository.find(query);
            return DistrictDto.fromList(districts);

        } catch (error) {
            console.error('Error while finding district:', error);
            throw error;
        }
    }

    async getDistrictsByIds(ids: string[]): Promise<DistrictDto[]> {
        try {
            const district = await this._districtRepository.find({ _id: { $in: ids } });
            return DistrictDto.fromList(district);
        } catch (error) {
            console.error('Error while finding districts by IDs:', error);
            throw error;
        }
    }

    async createDistrict(districtName: string): Promise<DistrictDto> {
        try {
            const existingDistrict = await this._districtRepository.findOne({ name: districtName });

            if (existingDistrict) {
                const error: any = new Error(MESSAGES.DISTRICT_EXISTS);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const district = await this._districtRepository.create({ name: districtName });
            return DistrictDto.from(district);
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async updateDistrict(districtId: string, districtName: string): Promise<DistrictDto | null> {
        try {
            return await this._districtRepository.updateById(districtId, { name: districtName });
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async deleteDistrict(districtId: string): Promise<DistrictDto | null> {
        try {
            const district = await this._districtRepository.findById(districtId);
            if (!district) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }
            district.isActive = false;
            return await this._districtRepository.updateById(districtId, district);
        } catch (error) {
            console.error('Error while creating district:', error);
            throw error;
        }
    }

    async createServiceArea(serviceAreaData: CreateAreaDto): Promise<ServiceAreaDto> {
        try {

            const existingServiceArea = await this._serviceAreaRepository.findOne({ name: serviceAreaData.name });

            if (existingServiceArea) {
                const error: any = new Error(MESSAGES.SERVICE_AREA_EXISTS);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const dataToSave = {
                ...serviceAreaData,
                districtId: new Types.ObjectId(serviceAreaData.districtId)
            };
            
            const serviceArea = await this._serviceAreaRepository.create(dataToSave);
            return ServiceAreaDto.from(serviceArea);
        } catch (error) {
            console.error('Error while creating ServiceArea:', error);
            throw error;
        }
    }

    async getServiceAreas(districtId: string): Promise<ServiceAreaDto[]> {
        try {
            const query: object = { districtId };
            const serviceAreas = await this._serviceAreaRepository.find(query);

            return ServiceAreaDto.fromList(serviceAreas);
        } catch (error) {
            console.error('Error while finding ServiceAreas:', error);
            throw error;
        }
    }

    async isServiceAvailable(serviceAreaId: string, pincode: string): Promise<ServiceAreaDto | null> {
        try {
            const query: object = {
                _id: serviceAreaId,
                postalCodes: { $in: [pincode] },
                isActive: true
            }

            const serviceArea = await this._serviceAreaRepository.findOne(query);

            if (!serviceArea) {
                const error: any = new Error(MESSAGES.SERVICE_AREA_NOT_FOUND);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            return ServiceAreaDto.from(serviceArea);

        } catch (error) {
            console.error('Error while checking availability:', error);
            throw error;
        }
    }

    async getServiceAreasByIds(ids: string[]): Promise<ServiceAreaDto[]> {
        try {
            const serviceAreas = await this._serviceAreaRepository.find({ _id: { $in: ids } });
            return ServiceAreaDto.fromList(serviceAreas);
        } catch (error) {
            console.error('Error while finding service areas by IDs:', error);
            throw error;
        }
    }

    async getDistrictWithServiceArea(districtId: string, serviceAreaId: string): Promise<{ district: DistrictDto; serviceArea: ServiceAreaDto; }> {
        try {

            const district = await this._districtRepository.findById(districtId);

            if (!district) {
                throw new Error(`District with ID ${districtId} not found`);
            }

            const serviceArea = await this._serviceAreaRepository.findById(serviceAreaId);

            if (!serviceArea) {
                throw new Error(`Service Area with ID ${serviceAreaId} not found`);
            }

            return { district: DistrictDto.from(district), serviceArea: ServiceAreaDto.from(serviceArea) };

        } catch (error) {
            console.error('Error while finding district with serviceArea:', error);
            throw error;
        }
    }

    async getDistrictsWithServiceAreas(): Promise<DistrictWithAreasDto[]> {
        try {
            const districtWithAreas = await this._districtRepository.getDistrictsWithServiceAreas();
            return DistrictWithAreasDto.fromList(districtWithAreas);
        } catch (error) {
            console.error('Error while finding district with serviceAreas:', error);
            throw error;
        }
    }

}