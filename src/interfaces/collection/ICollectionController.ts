import { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/httpStatus";
import { MESSAGES } from "../../constants/messages";

export interface ICollectionController{
    createCollectionRequest(req:Request,res:Response):Promise<void>;
    getCollectionHistory(req:Request,res:Response):Promise<void>;
    getCollectionHistories(req:Request,res:Response):Promise<void>;
    
    getAvailableCollectors(req:Request,res:Response):Promise<void>;
}