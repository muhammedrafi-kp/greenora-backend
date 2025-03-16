import { Request, Response } from "express";

export interface ICollcetorController {
    login(req: Request, res: Response): Promise<void>;
    signUp(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    resendOtp(req: Request, res: Response): Promise<void>;
    validateRefreshToken(req: Request, res: Response): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;

    getCollector(req: Request, res: Response): Promise<void>;
    getCollectors(req: Request, res: Response): Promise<void>;
    getAvailableCollectors(req: Request, res: Response): Promise<void>;
    updateCollector(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;

}