import { Request, Response } from "express";
import { IAdminController } from '../interfaces/admin/IAdminController';
import { IAdminService } from "../interfaces/admin/IAdminService";
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';

export class AdminController implements IAdminController {

    constructor(private adminService: IAdminService) { }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            console.log("Admin data: ", email, password);

            const { accessToken, refreshToken } = await this.adminService.login(email, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                // maxAge: 24 * 60 * 60 * 1000,  
                maxAge: 10 * 1000
            });

            res.status(HTTP_STATUS.OK).json({ accessToken });

        } catch (error: any) {
            console.error("Error while logging in: ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async createAdmin(req: Request, res: Response): Promise<any> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Email and password are required.',
                });
            }
            console.log("userdata: ", email, password);

            const admin = await this.adminService.createAdmin(email, password);
            console.log(admin);
            res.status(HTTP_STATUS.CREATED).json(admin);
        } catch (error: any) {
            console.error("Error while creating admin : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}