import { Model, Document, UpdateQuery, FilterQuery, QueryOptions } from 'mongoose';

export interface IBaseRepository<T extends Document> {
    create(data: Partial<T>): Promise<T>;
    findById(id: string): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;

    updateById(id: string, updateData: Partial<T>): Promise<T | null>;
    // findAll(): Promise<T>;
    // find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
    // update(id: string, data: UpdateQuery<T>): Promise<T | null>
    // delete(id: string): Promise<T | null>
}