import { IDistrict } from "../../models/District";
import {DistrictDto} from "../../dtos/response/district.dto"
import { IBaseRepository } from "../baseRepository/IBaseRepository";
import {IServiceArea} from "../../models/ServiceArea";

export interface IDistrictRepository extends IBaseRepository<IDistrict> {
    findDistrictByName(name: string): Promise<DistrictDto | null>;
    findAllDistricts(): Promise<DistrictDto[]>;
    getDistrictsWithServiceAreas(): Promise<(IDistrict & { serviceAreas: IServiceArea[] })[]>;
}