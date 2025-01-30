import { ICategoryRepository } from "../interfaces/ICategoryRepository";
import { ICategoryService } from "../interfaces/ICategoryService";
import { ICategory } from "../models/Category";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

export class CategoryService implements ICategoryService {
    constructor(private categoryRepository: ICategoryRepository) { };

    async createCategory(data: Partial<ICategory>): Promise<ICategory> {
        try {
            return await this.categoryRepository.create(data);
        } catch (error) {
            console.error('Error while creating category:', error);
            throw error;
        }
    }

    async getCategoryById(categoryId: string): Promise<ICategory | null> {
        try {
            return await this.categoryRepository.findById(categoryId)
        } catch (error) {
            console.error('Error while finding category:', error);
            throw error;
        }
    }

    async findCategoryByName(categoryName: string): Promise<ICategory | null> {
        try {
            return await this.categoryRepository.findByName(categoryName);
        } catch (error) {
            console.error('Error while finding category:', error);
            throw error;
        }
    }

    async getCategories(query: object): Promise<ICategory[]> {
        try {
            return await this.categoryRepository.findAll(query);
        } catch (error) {
            console.error('Error while finding categories:', error);
            throw error;
        }
    }

    async updateCategory(categoryId: string, categoryData: Partial<ICategory>): Promise<ICategory | null> {
        try {
            return await this.categoryRepository.updateById(categoryId, categoryData);
        } catch (error) {
            console.error('Error while updating category:', error);
            throw error;
        }
    }

    async deleteCategory(categoryId: string): Promise<ICategory | null> {
        try {
            const category = await this.categoryRepository.findById(categoryId);
            if (!category) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }
            category.isActive = false;
            return await this.categoryRepository.updateById(categoryId, category);
        } catch (error) {
            console.error('Error while deleting category:', error);
            throw error;
        }
    }
}