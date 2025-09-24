import { Types, Model, Document, FilterQuery, UpdateQuery, QueryOptions, ClientSession } from "mongoose";

export interface IBaseRepository<T extends Document> {
    create(data: Partial<T>, options?: { session?: ClientSession }): Promise<T>;

    findById(id: string | Types.ObjectId, options?: { session?: ClientSession }): Promise<T | null>;

    findOne(
        filter: FilterQuery<T>,
        options?: QueryOptions & { session?: ClientSession },
    ): Promise<T | null>;

    find(
        filter: FilterQuery<T>,
        projection?: Record<string, number>,
        sort?: Record<string, 1 | -1>, skip?: number,
        limit?: number, options?:
            { session?: ClientSession }
    ): Promise<T[]>;

    updateById(
        id: string | Types.ObjectId,
        data: UpdateQuery<T>,
        options?: QueryOptions & { session?: ClientSession }
    ): Promise<T | null>;

    updateOne(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>,
        options?: QueryOptions & { session?: ClientSession }
    ): Promise<T | null>;

    deleteById(id: string | Types.ObjectId, options?: { session?: ClientSession }): Promise<T | null>;

    startSession(): Promise<ClientSession>;
}