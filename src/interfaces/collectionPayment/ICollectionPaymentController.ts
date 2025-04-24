import {Request,Response} from "express";

export interface ICollectionPaymentController{
    initiatePayment(req:Request,res:Response):Promise<void>;
    verifyAdvancePayment(req:Request,res:Response):Promise<void>;
    getPaymentData(req:Request,res:Response):Promise<void>;
    requestPayment(req:Request,res:Response):Promise<void>;
    verifyPayment(req:Request,res:Response):Promise<void>;
}