import { Request, Response } from "express";
import { IWalletController } from "../interfaces/wallet/IWalletController";
import { IWalletService } from "../interfaces/wallet/IWalletService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


export class WalletController implements IWalletController {
    constructor(private readonly _walletService: IWalletService) { }

    async getWallet(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const wallet = await this._walletService.getWallet(userId);

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

    async getWalletWithTransactions(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const {
                type,
                startDate,
                endDate,
                page = 1,
                limit = 5,
            } = req.query;

            const queryOptions = {
                type: type?.toString(),
                startDate: startDate?.toString(),
                endDate: endDate?.toString(),
                page: Number(page),
                limit: Number(limit),
            };
            console.log("queryOptions :", queryOptions);

            const { balance, transactions } = await this._walletService.getWalletWithTransactions(userId, queryOptions);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.WALLET_FETCHED,
                data: { balance, transactions }
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
            console.log("user Id in initiateDeposit controller :", userId)
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
            console.log("user Id in controller :", userId)
            const razorpayVerificationData = req.body;
            console.log("razorpayVerificationData:", razorpayVerificationData);

            const transaction = await this._walletService.verifyDeposit(userId, razorpayVerificationData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_SUCCESSFULL,
                data: transaction
            });
        } catch (error: any) {

            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
            } else {
                console.error("Error during verifying payment:", error.message);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        }
    }

    async withdrawMoney(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-client-id'] as string;
            const amount = req.body.amount;
            const transaction = await this._walletService.withdrawMoney(userId, amount);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.MONEY_WITHDRAWN,
                data: transaction
            });
        } catch (error: any) {
            console.error("Error during withdrawing money:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}

