import { Request, Response } from "express";
import { ICategoryController } from "../interfaces/ICategoryController";
import { ICategoryService } from "../interfaces/ICategoryService";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";


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
            const categories = await this.categoryService.getCategories({ type: categoryType, isActive: true });

            if (categories) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: categories
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

    async updateCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;
            const categoryData = req.body;
            console.log("Data:", req.body);
            const updatedCategory = await this.categoryService.updateCategory(categoryId, categoryData);
            console.log("updatedCategory:", updatedCategory);
            if (updatedCategory) {
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: updatedCategory
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
}