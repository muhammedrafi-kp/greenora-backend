import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import Category, { ICategory } from "../models/Category";
import { BaseRepository } from "./baseRepository";

class CategoryRepository extends BaseRepository<ICategory> implements ICategoryRepository {
    constructor() {
        super(Category);
    }

    async findByName(name: string): Promise<ICategory | null> {
        try {
            return await this.findOne({ name });
        } catch (error) {
            throw new Error(`Error while finding category by name: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async calculateCost(categoryData: object): Promise<number> {
        try {
            // return await this.calculateCost(categoryData);
            console.log("categoryData :", categoryData);
            return 0;
        } catch (error) {
            throw new Error(`Error while calculating cost: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new CategoryRepository();