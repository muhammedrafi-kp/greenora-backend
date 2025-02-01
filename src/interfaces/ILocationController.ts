import {Request,Response} from "express";

export interface ILocationController{
    createDistrict(req:Request,res:Response):Promise<void>;
    getDistricts(req:Request,res:Response):Promise<void>;
    getDistrictsWithServiceAreas(req:Request,res:Response):Promise<void>;
    updateDistrict(req:Request,res:Response):Promise<void>;
    deleteDistrict(req:Request,res:Response):Promise<void>;
    createServiceArea(req:Request,res:Response):Promise<void>;
    getServiceAreas(req:Request,res:Response):Promise<void>;
    updateServiceArea(req:Request,res:Response):Promise<void>;
}