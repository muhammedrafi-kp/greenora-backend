import { Request, Response, NextFunction } from "express";
import { IUserController } from "../interfaces/user/IUserController";
import { IUserService } from "../interfaces/user/IUserService";
import passport from 'passport';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { IUser } from "../models/User";
import { PutObjectCommand } from '@aws-sdk/client-s3';

import { configDotenv } from 'dotenv';
import { error } from "console";
configDotenv();

export class UserController implements IUserController {

    constructor(private userService: IUserService) { };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Email and password are required.' });
                return;
            }

            const { accessToken, refreshToken, user } = await this.userService.login(email, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            const userData = { name: user.name, email: user.email }

            console.log("Login successfull!");
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.LOGIN_SUCCESS,
                token: accessToken,
                role: "user",
                data: userData
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.UNAUTHORIZED) {
                res.status(error.status).json({ message: error.message });
                return;
            }

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async signUp(req: Request, res: Response): Promise<void> {
        try {
            const userData = req.body;
            await this.userService.signUp(userData);

            res.status(HTTP_STATUS.OK).json({ success: true });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.CONFLICT) {
                res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
                return;
            }

            console.error("Error while signup : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<any> {
        try {
            const { email, otp } = req.body;

            console.log("email:", email);
            console.log("OTP:", otp);

            if (!email || !otp) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Email and OTP are required!" });
            }

            const { accessToken, refreshToken, user } = await this.userService.verifyOtp(email, otp);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            const userData = { name: user.name, email: user.email };

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: "OTP verification successful, user created!",
                token: accessToken,
                role: "user",
                data: userData
            });

        } catch (error: any) {

            if (error.status === 401) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message
                });
            }

            console.error("Error while verifying otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await this.userService.resendOtp(email);
            res.status(HTTP_STATUS.OK).json({ success: true });
        } catch (error: any) {
            console.error("Error while resending otp : ", error);
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

            const { accessToken, refreshToken } = await this.userService.validateRefreshToken(req.cookies.refreshToken);

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
                role: "user"
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

    async googleAuthCallback(req: Request, res: Response): Promise<void> {
        try {
            const { credential } = req.body;
            const { accessToken, refreshToken, user: { name, email } } = await this.userService.handleGoogleAuth(credential);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'none',
            });

            const userData = { name, email };

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.GOOGLE_AUTH_SUCCESS,
                token: accessToken,
                role: "user",
                data: userData
            });

        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async getUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];

            const user = await this.userService.getUser(userId as string);

            const userData = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileUrl: user.profileUrl
            }

            console.log("userdata in controller:", userData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: userData
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            console.error("Error while fetching user data in controller : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const { name, phone } = req.body;
            const profileImage = req.file;

            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'User ID is missing in the request headers.',
                });
                return;
            }

            const updatedData: Partial<IUser> = { name, phone };

            const updatedUser = await this.userService.updateUser(userId as string, updatedData, profileImage);

            if (!updatedUser) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found.',
                });
            } else {
                const userdata = {
                    name: updatedUser?.name,
                    email: updatedUser?.email,
                    phone: updatedUser?.phone,
                    profileUrl: updatedUser?.profileUrl,
                };

                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: userdata,
                });
            }
        } catch (error: any) {
            console.error('Error in updateUser controller:', error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            });
        }
    }

    async uploadProfileImage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const profileImage = req.file;
            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'User ID is missing in the request headers.',
                });
                return;
            }


            if (!profileImage) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Profile image file is missing in the request.",
                });
                return;
            }

            const profileUrl = await this.userService.uploadProfileImage(userId as string, profileImage);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Profile image uploaded successfully.",
                data: { profileUrl },
            });

        } catch (error: any) {
            console.error('Error in update user profile image:', error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            });
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const { currentPassword, newPassword } = req.body;
            console.log("currentPassword:", currentPassword);
            console.log("newPassword:", newPassword);

            await this.userService.changePassword(userId as string, currentPassword, newPassword);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Password changed successfully",
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            console.error("Error while changing password in controller : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

}