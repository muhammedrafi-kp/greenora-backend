import { Request, Response } from "express";
import { IWalletController } from "../interfaces/wallet/IWalletController";
import { IWalletService } from "../interfaces/wallet/IWalletService";
import {HTTP_STATUS} from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


export class WalletController implements IWalletController {
    constructor(private readonly _walletService: IWalletService) { }

    async getWalletData(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const wallet = await this._walletService.getWalletData(userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.WALLET_FETCHED,
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
            const { amount: orderAmount, orderId } = await this._walletService.initiateDeposit(userId, amount);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_INITIATED,
                data: {
                    amount: orderAmount,
                    orderId
                }
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

            await this._walletService.verifyDeposit(userId, razorpayVerificationData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_SUCCESSFULL,
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
            await this._walletService.withdrawMoney(userId, amount);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.MONEY_WITHDRAWN,
            });
        } catch (error: any) {
            console.error("Error during withdrawing money:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}

