import { Request, Response } from "express";
import { ICategoryController } from "../interfaces/category/ICategoryController";
import { ICategoryService } from "../interfaces/category/ICategoryService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

export class CategoryController implements ICategoryController {

    constructor(private _categoryService: ICategoryService) { };

    async createCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryData = req.body;
            console.log("category data:", categoryData);

            const category = await this._categoryService.createCategory(categoryData);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: MESSAGES.CATEGORY_CREATED,
                data: category
            });

        } catch (error) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async getCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;

            const category = await this._categoryService.getCategoryById(categoryId);

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

        } catch (error) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const categoryType = req.query.type;

            const query: any = { isActive: true };
            if (categoryType) {
                query.type = categoryType;
            }

            const categories = await this._categoryService.getCategories(query);

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


        } catch (error) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async updateCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;
            const categoryData = req.body;
            console.log("Data:", req.body);
            const updatedCategory = await this._categoryService.updateCategory(categoryId, categoryData);
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

        } catch (error) {
            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }

    async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;

            const updatedCategory = await this._categoryService.deleteCategory(categoryId);

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
                    message: error instanceof Error ? error.message : String(error)
                })
            };

            console.error("Error during login:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
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
            const estimatedCost = await this._categoryService.calculateCost(items);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: estimatedCost
            });
        } catch (error) {
            console.error("Error during calculate cost:", error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : String(error) });
        }
    }
    
}
