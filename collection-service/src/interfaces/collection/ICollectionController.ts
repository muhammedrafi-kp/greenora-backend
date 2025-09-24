import { Request, Response } from "express";

export interface ICollectionController {
    initiateRazorpayAdvance(req: Request, res: Response): Promise<void>;
    verifyRazorpayAdvance(req: Request, res: Response): Promise<void>;
    unlockPaymentLock(req: Request, res: Response): Promise<void>;
    
    payAdvanceWithWallet(req: Request, res: Response): Promise<void>;
    verifyRazorpayPayment(req: Request, res: Response): Promise<void>;
    payWithWallet(req: Request, res: Response): Promise<void>;

    scheduleCollectionManually(req: Request, res: Response): Promise<void>;
    getCollection(req: Request, res: Response): Promise<void>;
    getCollectionHistory(req: Request, res: Response): Promise<void>;
    getCollectionHistories(req: Request, res: Response): Promise<void>;
    getAvailableCollectors(req: Request, res: Response): Promise<void>;
    getAssignedCollections(req: Request, res: Response): Promise<void>;
    completeCollection(req: Request, res: Response): Promise<void>;
    cancelCollection(req: Request, res: Response): Promise<void>;
    requestCollectionPayment(req: Request, res: Response): Promise<void>;
    getDashboardData(req: Request, res: Response): Promise<void>;
    getCollectorDashboardData(req: Request, res: Response): Promise<void>;
    getRevenueData(req: Request, res: Response): Promise<void>;
    getCollectorRevenueData(req: Request, res: Response): Promise<void>;
}