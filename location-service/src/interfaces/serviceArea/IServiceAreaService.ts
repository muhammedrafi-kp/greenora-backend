import { IDistrict } from "../../models/District";
import { IServiceArea } from "../../models/ServiceArea";
import { DistrictDto } from "../../dtos/response/district.dto";
import { ServiceAreaDto } from "../../dtos/response/serviceArea.dto";
import { DistrictWithAreasDto } from "../../dtos/response/DistrictWithAreasDto.dto";

export interface IServiceAreaService {
    getDistricts(query: object): Promise<DistrictDto[]>;
    getDistrictsByIds(ids: string[]): Promise<DistrictDto[]>;
    createDistrict(districtName: string): Promise<DistrictDto>;
    updateDistrict(districtId: string, districtName: string): Promise<DistrictDto | null>;
    deleteDistrict(districtId: string): Promise<DistrictDto | null>;

    createServiceArea(serviceAreaData: IServiceArea): Promise<ServiceAreaDto>;
    getServiceAreas(districtId: string): Promise<ServiceAreaDto[]>;
    getServiceAreasByIds(ids: string[]): Promise<ServiceAreaDto[]>;
    isServiceAvailable(serviceAreaId: string, pincode: string): Promise<ServiceAreaDto | null>;

    getDistrictWithServiceArea(districtId: string, serviceAreaId: string): Promise<{ district: DistrictDto; serviceArea: ServiceAreaDto; }>
    getDistrictsWithServiceAreas(): Promise<DistrictWithAreasDto[]>;
}