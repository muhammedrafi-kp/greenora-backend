import { IDistrict } from "../../models/District";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IDistrictRepository extends IBaseRepository<IDistrict> {
    findDistrictByName(name: string): Promise<IDistrict | null>;
    findAllDistricts(): Promise<IDistrict[]>;
    getDistrictsWithServiceAreas(): Promise<IDistrict[]>;
}