import { Request, Response } from "express";
import { ICollectionPaymentController } from "../interfaces/collectionPayment/ICollectionPaymentController";
import { ICollectionPaymentService } from "../interfaces/collectionPayment/ICollectionPaymentService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

export class CollectionPaymentController implements ICollectionPaymentController {
    constructor(private _collectionPaymentService: ICollectionPaymentService) { };


    async createOrder(req: Request, res: Response): Promise<void> {
        try {
            const { amount } = req.body;
            const { orderId } = await this._collectionPaymentService.createRazorpayOrder(amount);
            res.status(HTTP_STATUS.OK).json({ success: true, orderId });

        } catch (error: any) {

            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }


    async verifyPayment(req: Request, res: Response): Promise<void> {
        try {
            const razorpayVerificationData = req.body;

            console.log("razorpayVerificationData :", razorpayVerificationData)

            const { isValidPayment, paymentId } = await this._collectionPaymentService.verifyPayment(razorpayVerificationData);

            if (!isValidPayment) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.PAYMENT_FAILED
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_SUCCESSFULL,
                paymentId
            });

        } catch (error: any) {
            console.error("Error during verifying payment:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }


    async payWithWallet(req: Request, res: Response): Promise<void> {
        try {
            const { userId, amount, serviceType } = req.body;

            if (!userId || !amount || !serviceType) {
                const error: any = new Error(MESSAGES.INVALID_DATA);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            console.log("userId :", userId);
            console.log("amount :", amount);
            console.log("serviceType :", serviceType);

            const { transactionId, paymentId } = await this._collectionPaymentService.payWithWallet(userId, amount, serviceType);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: MESSAGES.PAYMENT_SUCCESSFULL,
                transactionId,
                paymentId
            });

        } catch (error: any) {

            if (error.status === HTTP_STATUS.BAD_REQUEST) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
                return;
            }

            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }




    async getPaymentData(req: Request, res: Response): Promise<void> {
        try {
            const paymentId = req.params.paymentId;
            const paymentData = await this._collectionPaymentService.getPaymentData(paymentId);
            console.log("payment data:", paymentData)
            if (!paymentData) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.PAYMENT_NOT_FOUND
                });
                return;
            }
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: paymentData
            });


        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }




}