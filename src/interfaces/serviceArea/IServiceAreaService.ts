import { IDistrict } from "../../models/District";
import { IServiceArea } from "../../models/ServiceArea";


export interface IServiceAreaService {
    createDistrict(districtName: string): Promise<IDistrict>;
    updateDistrict(districtId: string, districtName: string): Promise<IDistrict | null>;
    deleteDistrict(districtId: string): Promise<IDistrict | null>;
    createServiceArea(serviceAreaData: IServiceArea): Promise<IServiceArea>;
    getDistricts(query: object): Promise<IDistrict[]>;
    getServiceAreas(districtId: string): Promise<IServiceArea[]>;
    getDistrictsWithServiceAreas(): Promise<IDistrict[]>;
    isServiceAvailable(serviceAreaId: string, pincode: string): Promise<IServiceArea | null>;
    getDistrictWithServiceArea(districtId:string,serviceAreaId:string):Promise<{ district: IDistrict; serviceArea: IServiceArea; }>
}