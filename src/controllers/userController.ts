import { Request, Response, NextFunction } from "express";
import { IUserController } from "../interfaces/user/IUserController";
import { IUserService } from "../interfaces/user/IUserService";
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { IUser } from "../models/User";
import { PutObjectCommand } from '@aws-sdk/client-s3';

import { configDotenv } from 'dotenv';
configDotenv();

export class UserController implements IUserController {

    constructor(private _userService: IUserService) { };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;


            if (!email || !password) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Email and password are required.' });
                return;
            }

            const { accessToken, refreshToken, user } = await this._userService.login(email, password);

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
                data: {
                    token: accessToken,
                    role: "user",
                    user: userData
                }
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.UNAUTHORIZED || error.status === HTTP_STATUS.FORBIDDEN) {
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
            await this._userService.signUp(userData);

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

            const { accessToken, refreshToken, user } = await this._userService.verifyOtp(email, otp);

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
                data: {
                    token: accessToken,
                    role: "user",
                    user: userData
                }
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
            await this._userService.resendOtp(email);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.OTP_RESENT });
        } catch (error: any) {
            console.error("Error while resending otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async sendResetPasswordLink(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            console.log("email:", email);

            await this._userService.sendResetPasswordLink(email);

            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.RESET_PASSWORD_LINK_SENT });


        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });

                return;
            }
            console.error("Error sending reset link : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {

            const { token, password } = req.body;
            console.log("reset token : ", token);
            console.log("password : ", password);

            await this._userService.resetPassword(token, password);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PASSWORD_UPDATED
            });

        } catch (error: any) {
            if (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.UNAUTHORIZED) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            console.error("Error while resetting password: ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async googleAuthCallback(req: Request, res: Response): Promise<void> {
        try {
            const { credential } = req.body;
            const { accessToken, refreshToken, user: { name, email } } = await this._userService.handleGoogleAuth(credential);

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
                data: {
                    token: accessToken,
                    role: "user",
                    user: userData
                }
            });

        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async getUserBlockedStatus(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.clientId;
            const isBlocked = await this._userService.getUserBlockedStatus(userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: isBlocked ? "User is blocked" : "User is not blocked",
                isBlocked
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
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

            const { accessToken, refreshToken } = await this._userService.validateRefreshToken(req.cookies.refreshToken);

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

    async getUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'];

            const user = await this._userService.getUser(userId as string);

            user.password = '';

            console.log("userdata in controller:", user);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: user
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
            const userId = req.headers['x-client-id'];
            const { name, phone } = req.body;
            const profileImage = req.file;

            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.USER_ID_MISSING,
                });
                return;
            }

            const updatedData: Partial<IUser> = { name, phone };

            const updatedUser = await this._userService.updateUser(userId as string, updatedData, profileImage);

            if (!updatedUser) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.USER_NOT_FOUND,
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
                    message: MESSAGES.USER_UPDATED,
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
            const userId = req.headers['x-client-id'];
            const profileImage = req.file;
            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.USER_ID_MISSING,
                });
                return;
            }


            if (!profileImage) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.PROFILE_IMAGE_MISSING,
                });
                return;
            }

            const profileUrl = await this._userService.uploadProfileImage(userId as string, profileImage);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PROFILE_IMAGE_UPLOADED,
                data: profileUrl,
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
            const userId = req.headers['x-client-id'];
            const { currentPassword, newPassword } = req.body;
            console.log("currentPassword:", currentPassword);
            console.log("newPassword:", newPassword);

            await this._userService.changePassword(userId as string, currentPassword, newPassword);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PASSWORD_UPDATED,
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

    async getCollector(req: Request, res: Response): Promise<void> {
        try {
            const collectorId = req.params.collectorId;
            const collector = await this._userService.getCollector(collectorId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.COLLECTOR_FETCHED,
                data: collector
            });
        } catch (error: any) {
            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            console.error("Error while fetching collector data in controller !!!!!!!!!!1: ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getAdmin(req: Request, res: Response): Promise<void> {
        try {
            const admin = await this._userService.getAdmin();
            res.status(HTTP_STATUS.OK).json({ success: true, data: admin });
        } catch (error: any) {
            console.error("Error while fetching admin data in controller : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const userIds: string[] = req.body;

            console.log("userids:", userIds);

            const users = await this._userService.getUsers(userIds);

            res.status(HTTP_STATUS.OK).json({ success: true, data: users });

        } catch (error: any) {
            console.error("Error while fetching users data in controller : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

}