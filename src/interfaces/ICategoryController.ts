import { Request, Response } from "express";

export interface ICategoryController {
    createCategory(req: Request, res: Response): Promise<void>;
    getCategory(req: Request, res: Response): Promise<void>;
    getCategories(req: Request, res: Response): Promise<void>;
    updateCategory(req: Request, res: Response): Promise<void>;
    deleteCategory(req: Request, res: Response): Promise<void>;
}
