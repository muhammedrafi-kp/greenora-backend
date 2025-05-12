import { Request, Response, NextFunction } from 'express';

export interface IUserController {
    login(req: Request, res: Response): Promise<void>;
    signUp(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    resendOtp(req: Request, res: Response): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
    sendResetPasswordLink(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;

    getUser(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    uploadProfileImage(req: Request, res: Response): Promise<void>;
    validateRefreshToken(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
    getCollector(req: Request, res: Response): Promise<void>;
    getAdmin(req: Request, res: Response): Promise<void>;
    getUserBlockedStatus(req: Request, res: Response): Promise<void>;
}