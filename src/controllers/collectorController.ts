
import { Request, Response } from "express";
import { ICollcetorController } from "../interfaces/collector/ICollectorController";
import { ICollectorService } from "../interfaces/collector/ICollectorServices";
import { HTTP_STATUS } from "../constants/httpStatus";

export class CollcetorController implements ICollcetorController {

    constructor(private collectorService: ICollectorService) { };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Email and password are required.',
                });
                return;
            }

            const { accessToken, refreshToken, collector } = await this.collectorService.login(email, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                // maxAge: 24 * 60 * 60 * 1000,  
                maxAge: 10 * 1000
            });

            const collectorData = { name: collector.name, email: collector.email }

            console.log("Login successfull!");
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Login successful",
                token: accessToken,
                data: collectorData
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
            const collectorData = req.body;
            await this.collectorService.signUp(collectorData);

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

            const { accessToken, refreshToken, collector } = await this.collectorService.verifyOtp(email, otp);

            const collectorData = { name: collector.name, email: collector.email };

            res.status(HTTP_STATUS.CREATED).json({ message: "OTP verification successful, user created!", data: collectorData });
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
            await this.collectorService.resendOtp(email);
            res.status(HTTP_STATUS.OK).json({ success: true });
        } catch (error: any) {
            console.error("Error while resending otp : ", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCollector(req: Request, res: Response): Promise<void> {
        try {
            console.log("req.headers[x-user-id] :", req.headers['x-user-id']);
            const userId = req.headers['x-user-id'];
            if (!userId) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "invalid user id" });
                return
            }
            const user = await this.collectorService.getCollector(userId as string);

            const collectorData = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileUrl: user.profileUrl,
                serviceArea: user.serviceArea
            }

            console.log("collectorData in controller:", collectorData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: collectorData
            });

        } catch (error: any) {
            // if (error.status === 401) {
            //     return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            //         success: false,
            //         message: error.message
            //     });
            // }

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                })
            }

            console.error("Error while fetching collectorData : ", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}