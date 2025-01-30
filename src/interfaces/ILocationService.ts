import { IDistrict } from "../models/District";
import { IServiceArea } from "../models/ServiceArea";


export interface ILocationService {
    createDistrict(districtName: string): Promise<IDistrict>;
    updateDistrict(districtId:string,districtName: string): Promise<IDistrict|null>;
    deleteDistrict(districtId: string): Promise<IDistrict | null>;
    createServiceArea(serviceAreaData: IServiceArea): Promise<IServiceArea>;
    findDistricts(query: object): Promise<IDistrict[]>;
    findServiceAreas(districtId: string): Promise<IServiceArea[]>;
    getDistrictsWithServiceAreas(): Promise<IDistrict[]>;
}