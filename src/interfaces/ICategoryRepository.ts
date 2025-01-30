import { IBaseRepository } from "./IBaseRepository";
import { ICategory } from "../models/Category";

export interface ICategoryRepository extends IBaseRepository<ICategory>{
    findByName(name: string): Promise<ICategory | null>;
}