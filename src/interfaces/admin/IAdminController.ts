import { Request,Response } from "express";

export interface IAdminController{
    login(req:Request,res:Response):Promise<void>;
    createAdmin(req:Request,res:Response):Promise<any>;
}