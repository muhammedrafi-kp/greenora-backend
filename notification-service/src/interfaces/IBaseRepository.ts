import { Types, Document, FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export interface IBaseRepository<T extends Document> {
    create(data: Partial<T>): Promise<T>;
    findById(id: string | Types.ObjectId): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    find(filter: FilterQuery<T>, projection?: Record<string, number>, options?: QueryOptions): Promise<T[]>;
    updateById(id: string | Types.ObjectId, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<{ matchedCount: number; modifiedCount: number }>;
    deleteById(id: string | Types.ObjectId): Promise<T | null>;
    count(filter: FilterQuery<T>): Promise<number>;
}