import { Request, Response } from "express";
import { ICollcetorController } from "../interfaces/collector/ICollectorController";
import { ICollectorService } from "../interfaces/collector/ICollectorServices";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ICollector } from "../models/Collector";
import { MESSAGES } from '../constants/messages';
import { setRefreshTokenCookie } from "../utils/cookie"
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from "../config/s3Config";

export class CollcetorController implements ICollcetorController {

    constructor(private _collectorService: ICollectorService) { };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;


            if (!email || !password) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Email and password are required.',
                });
                return;
            }

            const { accessToken, refreshToken, collector } = await this._collectorService.login(email, password);

            setRefreshTokenCookie(res, refreshToken);

            console.log("Login successfull!");
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Login successful",
                data: { token: accessToken, role: "collector", collector }
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
            const collectorData = req.body;
            await this._collectorService.signUp(collectorData);

            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.OTP_SENT });

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

            const { accessToken, refreshToken, collector } = await this._collectorService.verifyOtp(email, otp);

            setRefreshTokenCookie(res, refreshToken);

            const collectorData = { name: collector.name, email: collector.email };

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: "OTP verification successful, user created!",
                data: {
                    token: accessToken,
                    role: "collector",
                    collector: collectorData
                }
            });

        } catch (error: any) {

            if (error.status === 401) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: error.message });
            }

            console.error("Error while verifying otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await this._collectorService.resendOtp(email);
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

            await this._collectorService.sendResetPasswordLink(email);

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

            await this._collectorService.resetPassword(token, password);

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

            const { accessToken, refreshToken } = await this._collectorService.validateRefreshToken(req.cookies.refreshToken);

            setRefreshTokenCookie(res, refreshToken);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "token created!",
                token: accessToken,
                role: "collector"
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
            const { accessToken, refreshToken, collector } = await this._collectorService.handleGoogleAuth(credential);

            setRefreshTokenCookie(res, refreshToken);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.GOOGLE_AUTH_SUCCESS,
                data: {token: accessToken,role: "collector",collector}
            });

        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCollector(req: Request, res: Response): Promise<void> {
        try {
            const collectorId = req.headers['x-client-id']
            if (!collectorId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "invalid user id" });
                return
            }
            const collector = await this._collectorService.getCollector(collectorId as string);

            console.log("collector:", collector);

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

            console.error("Error while fetching collectorData : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCollectors(req: Request, res: Response): Promise<void> {
        try {
            const collectorIds: string[] = req.body;
            console.log("collectorIds:", collectorIds);

            const collectors = await this._collectorService.getCollectors(collectorIds);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.COLLECTORS_FETCHED,
                data: collectors
            });

        } catch (error: any) {
            console.error("Error while getting available collectors : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateCollector(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'];
            const { name, phone, gender, district, serviceArea, idProofType } = req.body;
            console.log("req.body :", req.body);
            const files = req.files as {
                [fieldname: string]: Express.Multer.File[]
            };

            let profileUrl: string | undefined;
            let idProofFrontUrl: string | undefined;
            let idProofBackUrl: string | undefined;

            // Handle profile image upload
            if (files['profileImage']) {
                const profileImage = files['profileImage'][0];
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME!,
                    Key: `profile-images/collector/${Date.now()}_${profileImage.originalname}`,
                    Body: profileImage.buffer,
                    ContentType: profileImage.mimetype,
                };

                const command = new PutObjectCommand(s3Params);
                await s3.send(command);

                profileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
            }

            // Handle ID proof front image upload
            if (files['idProofFront']) {
                const idProofFront = files['idProofFront'][0];
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME!,
                    Key: `id-proofs/collector/${Date.now()}_front_${idProofFront.originalname}`,
                    Body: idProofFront.buffer,
                    ContentType: idProofFront.mimetype,
                };

                const command = new PutObjectCommand(s3Params);
                await s3.send(command);

                idProofFrontUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
            }

            // Handle ID proof back image upload
            if (files['idProofBack']) {
                const idProofBack = files['idProofBack'][0];
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME!,
                    Key: `id-proofs/collector/${Date.now()}_back_${idProofBack.originalname}`,
                    Body: idProofBack.buffer,
                    ContentType: idProofBack.mimetype,
                };

                const command = new PutObjectCommand(s3Params);
                await s3.send(command);

                idProofBackUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
            }

            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'User ID is missing in the request headers.',
                });
                return;
            }

            const updatedData: Partial<ICollector> = {
                name,
                phone,
                gender,
                district,
                serviceArea,
                ...(idProofType && { idProofType }),
                ...(profileUrl && { profileUrl }),
                ...(idProofFrontUrl && { idProofFrontUrl }),
                ...(idProofBackUrl && { idProofBackUrl }),
                verificationStatus: 'requested'
            };

            const updatedCollector = await this._collectorService.updateCollector(userId as string, updatedData);

            if (!updatedCollector) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.COLLECTOR_NOT_FOUND,
                });
                return;
            }

            const collectorData = {
                name: updatedCollector.name,
                email: updatedCollector.email,
                phone: updatedCollector.phone,
                district: updatedCollector.district,
                serviceArea: updatedCollector.serviceArea,
                profileUrl: updatedCollector.profileUrl,
                idProofType: updatedCollector.idProofType,
                verificationStatus: updatedCollector.verificationStatus
            };

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.COLLECTOR_UPDATED,
                data: collectorData,
            });
        } catch (error: any) {
            console.error('Error in updateCollector controller:', error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'An internal server error occurred.',
            });
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const collectorId = req.headers['x-client-id'];
            const { currentPassword, newPassword } = req.body;
            console.log("currentPassword:", currentPassword);
            console.log("newPassword:", newPassword);

            await this._collectorService.changePassword(collectorId as string, currentPassword, newPassword);

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

    async getAvailableCollector(req: Request, res: Response): Promise<void> {
        try {
            const { serviceAreaId, preferredDate } = req.body;

            const collector = await this._collectorService.getAvailableCollector(serviceAreaId, preferredDate);

            res.status(HTTP_STATUS.OK).json({ success: true, data: collector });


        } catch (error: any) {

            console.error("Error while getting available collectors : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCollectorBlockedStatus(req: Request, res: Response): Promise<void> {
        try {
            const collectorId = req.params.clientId;
            const isBlocked = await this._collectorService.getCollectorBlockedStatus(collectorId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: isBlocked ? "Collector is blocked" : "Collector is not blocked",
                isBlocked
            });
        } catch (error: any) {
            console.error("Error while getting collector blocked status : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

}