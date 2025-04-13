
import { Request, Response } from "express";

export interface IWalletController {
    getWalletData(req: Request, res: Response): Promise<void>;
    initiateDeposit(req: Request, res: Response): Promise<void>;
    verifyDeposit(req: Request, res: Response): Promise<void>;
    withdrawMoney(req: Request, res: Response): Promise<void>;
}
