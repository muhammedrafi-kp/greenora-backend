import { IServiceArea } from "../models/ServiceArea";
import { BaseRepository } from "../repositories/baseRepository";

export interface IServiceAreaRepository {
    createServiceArea(serviceAreaData:IServiceArea):Promise<IServiceArea>;
    findServiceAreaById(serviceAreaId:string):Promise<IServiceArea|null>;
    findAllServiceAreas():Promise<IServiceArea[]>;
}