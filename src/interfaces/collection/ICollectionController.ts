import { Request, Response } from "express";

export interface ICollectionController {


    initiateAdvancePayment(req: Request, res: Response): Promise<void>;
    verifyAdvancePayment(req: Request, res: Response): Promise<void>;
    verifyCollectionPayment(req: Request, res: Response): Promise<void>;


    scheduleCollectionManually(req: Request, res: Response): Promise<void>;
    getCollectionHistory(req: Request, res: Response): Promise<void>;
    getCollectionHistories(req: Request, res: Response): Promise<void>;
    getAvailableCollectors(req: Request, res: Response): Promise<void>;
    getAssignedCollections(req: Request, res: Response): Promise<void>;
    completeCollection(req: Request, res: Response): Promise<void>;
    cancelCollection(req: Request, res: Response): Promise<void>;
    requestCollectionPayment(req: Request, res: Response): Promise<void>;
    getRevenueData(req: Request, res: Response): Promise<void>;
}