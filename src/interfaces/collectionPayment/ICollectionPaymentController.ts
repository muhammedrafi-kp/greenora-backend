import {Request,Response} from "express";

export interface ICollectionPaymentController{

    createOrder(req:Request,res:Response):Promise<void>;
    verifyPayment(req:Request,res:Response):Promise<void>;

    getPaymentData(req:Request,res:Response):Promise<void>;
}