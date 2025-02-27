import { Types, Model, Document, UpdateQuery, FilterQuery, QueryOptions } from 'mongoose';

export interface IBaseRepository<T extends Document> {
    create(data: Partial<T>): Promise<T>;
    findById(id: string | Types.ObjectId, projection?: Record<string, number>): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    find(filter: FilterQuery<T>, projection?: Record<string, number>): Promise<T[]>;
    // find(filter?: FilterQuery<T>, projection?: Record<string, number>): Promise<T[]>;
    updateById(id: string | Types.ObjectId, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    deleteById(id: string | Types.ObjectId): Promise<T | null>;
}