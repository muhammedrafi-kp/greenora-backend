import { Request, Response } from "express";

export interface ICategoryController {
    createCategory(req: Request, res: Response): Promise<void>;
    getCategory(req: Request, res: Response): Promise<void>;
    getCategories(req: Request, res: Response): Promise<void>;
    updateCategory(req: Request, res: Response): Promise<void>;
    deleteCategory(req: Request, res: Response): Promise<void>;
    calculateCost(req: Request, res: Response): Promise<void>;
    // initiatePayment(req: Request, res: Response): Promise<void>;
}
