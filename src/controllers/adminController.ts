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
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                token: accessToken,
                role:"admin"
            });

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

    async validateRefreshToken(req: Request, res: Response): Promise<void> {
        try {

            console.log("req.cookies :", req.cookies);
            
            if (!req.cookies.refreshToken) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.TOKEN_NOT_FOUND,
                });
                return;
            }

            const { accessToken, refreshToken } = await this.adminService.validateRefreshToken(req.cookies.refreshToken);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "token created!",
                token: accessToken,
                role:"admin"
            });

        } catch (error: any) {

            if (error.status === 401) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            })
        }
    }

    // async getUsers(req: Request, res: Response): Promise<void> {
    //     try {
    //         const { search, filter, sort, page = 1, limit = 10 } = req.query;


    //         console.log("heloooooo",search, filter, sort, page, limit);

    //         res.json({ message: "ok" });
    //     } catch (error: any) {
    //         console.error("Error while fetching users data : ", error);
    //         res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    //     }
    // }

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.adminService.getUsers();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: users
            });

        } catch (error: any) {
            console.error("Error while fetching users data : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCollectors(req: Request, res: Response): Promise<void> {
        try {
            const collectors = await this.adminService.getCollectors();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: collectors
            });
        } catch (error: any) {
            console.error("Error while fetching collectors data", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            console.log("Id :", id);
            const message = await this.adminService.updateUserStatus(id);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message
            });
        } catch (error: any) {
            console.error("Error while updating status : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateCollectorStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            console.log("Id :", id);
            const message = await this.adminService.updateCollectorStatus(id);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message
            });
        } catch (error: any) {
            console.error("Error while updating status : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}