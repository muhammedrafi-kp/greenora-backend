
import { ICategory } from "../models/Category";

export interface ICategoryService {
    createCategory(categoryData: Partial<ICategory>): Promise<ICategory>;
    getCategoryById(categoryId: string): Promise<ICategory | null>;
    findCategoryByName(categoryName: string): Promise<ICategory | null>;
    getCategories(query: object): Promise<ICategory[]>;
    updateCategory(categoryId: string, categoryData: Partial<ICategory>): Promise<ICategory | null>;
    deleteCategory(categoryId: string): Promise<ICategory | null>;
}
