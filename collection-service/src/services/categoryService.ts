import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { ICategoryService } from "../interfaces/category/ICategoryService";
import { ICategory } from "../models/Category";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

export class CategoryService implements ICategoryService {
    constructor(private _categoryRepository: ICategoryRepository) { };

    async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
        try {
            return await this._categoryRepository.create(categoryData);
        } catch (error) {
            console.error('Error while creating category:', error);
            throw error;
        }
    }

    async getCategoryById(categoryId: string): Promise<ICategory | null> {
        try {
            return await this._categoryRepository.findById(categoryId)
        } catch (error) {
            console.error('Error while finding category:', error);
            throw error;
        }
    }

    async findCategoryByName(categoryName: string): Promise<ICategory | null> {
        try {
            return await this._categoryRepository.findByName(categoryName);
        } catch (error) {
            console.error('Error while finding category:', error);
            throw error;
        }
    }

    async getCategories(query: object): Promise<ICategory[]> {
        try {
            return await this._categoryRepository.findAll(query);
        } catch (error) {
            console.error('Error while finding categories:', error);
            throw error;
        }
    }

    async updateCategory(categoryId: string, categoryData: Partial<ICategory>): Promise<ICategory | null> {
        try {
            return await this._categoryRepository.updateById(categoryId, categoryData);
        } catch (error) {
            console.error('Error while updating category:', error);
            throw error;
        }
    }

    async deleteCategory(categoryId: string): Promise<ICategory | null> {
        try {
            const category = await this._categoryRepository.findById(categoryId);
            if (!category) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }
            category.isActive = false;
            return await this._categoryRepository.updateById(categoryId, category);
        } catch (error) {
            console.error('Error while deleting category:', error);
            throw error;
        }
    }

    async calculateCost(categoryData: { categoryId: string; qty: string; }[]): Promise<number> {
        try {
            let totalCost = 0;

            for (const category of categoryData) {
                const categoryData = await this._categoryRepository.findById(category.categoryId);

                if (categoryData) {
                    totalCost += categoryData.rate * Number(category.qty);
                }
            }
            return totalCost;
        } catch (error) {
            console.error('Error while calculating cost:', error);
            throw error;
        }
    }

}