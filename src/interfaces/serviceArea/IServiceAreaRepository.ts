import { IServiceArea } from "../../models/ServiceArea";
import { BaseRepository } from "../../repositories/baseRepository";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IServiceAreaRepository extends IBaseRepository<IServiceArea> {
    findServiceAreaById(serviceAreaId: string): Promise<IServiceArea | null>;
}