import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/httpStatus";
import { IWalletController } from "../interfaces/wallet/IWalletController";
import { IWalletService } from "../interfaces/wallet/IWalletService";

export class WalletController implements IWalletController {
    constructor(private readonly walletService: IWalletService) { }

    async getWalletData(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const wallet = await this.walletService.getWalletData(userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: wallet
            });
        } catch (error: any) {

            if (error.status === HTTP_STATUS.NOT_FOUND) {
                res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        }
    }

    async initiateDeposit(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const amount = req.body.amount;
            const { amount: orderAmount, orderId } = await this.walletService.initiateDeposit(userId, amount);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                amount: orderAmount,
                orderId
            });

        } catch (error: any) {
            console.error("Error during initiating payment:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async verifyDeposit(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const razorpayVerificationData = req.body;
            console.log("razorpayVerificationData:", razorpayVerificationData);
            await this.walletService.verifyDeposit(userId, razorpayVerificationData);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Money deposited successfully"
            });
        } catch (error: any) {

            if(error.status === HTTP_STATUS.BAD_REQUEST){
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
            }else{
                console.error("Error during verifying payment:", error.message);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        }
    }

    async withdrawMoney(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const amount = req.body.amount;
            await this.walletService.withdrawMoney(userId, amount);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Money withdrawn successfully"
            });
        } catch (error: any) {
            console.error("Error during withdrawing money:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}

