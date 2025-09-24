import { IDistrict } from "../../models/District";
import {IServiceArea} from "../../models/ServiceArea";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IDistrictRepository extends IBaseRepository<IDistrict> {
    getDistrictsWithServiceAreas(): Promise<(IDistrict & { serviceAreas: IServiceArea[] })[]>;
}