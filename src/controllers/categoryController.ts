import { Request, Response } from "express";
import { ICategoryController } from "../interfaces/category/ICategoryController";
import { ICategoryService } from "../interfaces/category/ICategoryService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg/orders"; // Test mode
const APP_ID = process.env.CASHFREE_APP_ID || "";
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";

export class CategoryController implements ICategoryController {

    constructor(private categoryService: ICategoryService) { };

    async createCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryData = req.body;
            console.log("category data:", categoryData);

            const category = await this.categoryService.createCategory(categoryData);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.CATEGORY_CREATED,
                data: category
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;

            const category = await this.categoryService.getCategoryById(categoryId);

            if (category) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: category
                });
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.CATEGORY_NOT_FOUND,
                });
            }

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const categoryType = req.query.type;

            const query: any = { isActive: true };
            if (categoryType) {
                query.type = categoryType;
            }

            const categories = await this.categoryService.getCategories(query);

            if (!categories) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.CATEGORY_NOT_FOUND,
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: categories
            });


        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async updateCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;
            const categoryData = req.body;
            console.log("Data:", req.body);
            const updatedCategory = await this.categoryService.updateCategory(categoryId, categoryData);
            console.log("updatedCategory:", updatedCategory);

            if (!updatedCategory) {
                res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.CATEGORY_NOT_FOUND,
                });
                return;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: updatedCategory
            });

        } catch (error: any) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;

            const updatedCategory = await this.categoryService.deleteCategory(categoryId);

            if (updatedCategory) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                });
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.UNKNOWN_ERROR,
                });
            }

        } catch (error: any) {

            if (error.status === HTTP_STATUS.GONE) {
                res.status(HTTP_STATUS.GONE).json({
                    success: false,
                    message: error.message
                })
            };

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    async calculateCost(req: Request, res: Response): Promise<void> {
        try {
            const { items } = req.body;
            console.log("items:", items);

            if (!items || !Array.isArray(items)) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.INVALID_INPUT
                });
                return;
            }
            console.log("items:", items);
            const estimatedCost = await this.categoryService.calculateCost(items);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: estimatedCost
            });
        } catch (error: any) {
            console.error("Error during calculate cost:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

    // async initiatePayment(req: Request, res: Response): Promise<void> {
    //     try {
    //         const { amount, customer_id, customer_name, email, phone, payment_method } = req.body;
    //         console.log("req.body:", req.body);
    //         console.log("CASHFREE_BASE_URL:", CASHFREE_BASE_URL);
    //         console.log("APP_ID:", APP_ID);
    //         console.log("SECRET_KEY:", SECRET_KEY);

    //         const response = await axios.post(
    //             CASHFREE_BASE_URL,
    //             {
    //                 order_amount: amount,
    //                 order_currency: "INR",
    //                 customer_details: {
    //                     customer_id,
    //                     customer_name,
    //                     customer_email: email,
    //                     customer_phone: phone,
    //                 },
    //                 order_meta: {
    //                     return_url: "http://localhost:80/payment-status?order_id={order_id}",
    //                 },
    //                 payment_method: payment_method || "upi",
    //             },
    //             {
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     "x-client-id": APP_ID,
    //                     "x-client-secret": SECRET_KEY,
    //                     "x-api-version": "2023-08-01",
    //                 },
    //             }
    //         );

    //         console.log("response:", response.data);

    //         res.status(HTTP_STATUS.OK).json({
    //             success: true,
    //             data: response.data
    //         });

    //     } catch (error: any) {
    //         console.error("Error during initiate payment:", error.message);
    //         res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
    //     }
    // }
}
