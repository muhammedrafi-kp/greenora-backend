import { Request, Response } from "express";

export interface IAdminController {
    login(req: Request, res: Response): Promise<void>;
    createAdmin(req: Request, res: Response): Promise<any>;
    validateRefreshToken(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    getCollectors(req: Request, res: Response): Promise<void>;
    getVerificationRequests(req: Request, res: Response): Promise<void>;
    updateVerificationStatus(req: Request, res: Response): Promise<void>;
    updateUserStatus(req: Request, res: Response): Promise<void>;
    updateCollectorStatus(req: Request, res: Response): Promise<void>;
}