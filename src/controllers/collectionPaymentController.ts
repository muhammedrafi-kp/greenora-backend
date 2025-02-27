import { Request, Response } from "express";
import { ICollectionPaymentController } from "../interfaces/collectionPayment/ICollectionPaymentController";
import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

export class CollectionPaymentController implements ICollectionPaymentController {
    constructor(private collectionPaymentService: ICollectionPaymentService) { };

    async initiatePayment(req: Request, res: Response): Promise<void> {
        try {

            const userId = req.headers['x-user-id'];
            const collectionData = req.body;

            console.log("collectionData :", collectionData);
            console.log("userId :", userId);

            if (!collectionData || Object.keys(collectionData).length === 0) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.COLLECTION_DATA_REQUIRED,
                });
                return;
            }

            const { orderId, amount } = await this.collectionPaymentService.initiatePayment(userId as string, collectionData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                orderId,
                amount
            })

        } catch (error: any) {
            console.error("Error during initiating payment:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async verifyPayment(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.headers['x-user-id'];
            const razorpayVerificationData = req.body;

            console.log("userId :",userId);
            console.log("razorpayVerificationData :",razorpayVerificationData)

            const response = await this.collectionPaymentService.verifyPayment(userId as string,razorpayVerificationData);

            if (!response) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.PAYMENT_FAILED
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_SUCCESSFULL
            });

        } catch (error: any) {
            console.error("Error during initiating payment:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
}