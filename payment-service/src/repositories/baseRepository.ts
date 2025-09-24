import { Types, Model, Document, FilterQuery, UpdateQuery, QueryOptions, ClientSession } from 'mongoose';
import { IBaseRepository } from '../interfaces/baseRepository/IBaseRepository';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    constructor(protected readonly model: Model<T>) { };

    async create(data: Partial<T>, options?: { session?: ClientSession }): Promise<T> {
        try {
            const entity = new this.model(data);
            return await entity.save(options);
        } catch (error) {
            throw new Error(`Create fialed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findById(id: string | Types.ObjectId, options?: { session?: ClientSession }): Promise<T | null> {
        try {
            return await this.model.findById(id, null, options || {});
        } catch (error) {
            throw new Error(`findById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findOne(
        filter: FilterQuery<T>,
        options?: QueryOptions & { session?: ClientSession },
        sort?: Record<string, number>
    ): Promise<T | null> {
        try {
            return await this.model.findOne(filter, {}, { ...options, sort });
        } catch (error) {
            throw new Error(`findOne is failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async find(
        filter: FilterQuery<T> = {},
        projection?: Record<string, number>,
        sort?: Record<string, 1 | -1>,
        skip?: number,
        limit?: number,
        options?: { session?: ClientSession }
    ): Promise<T[]> {
        try {
            if (typeof skip == 'number' && typeof limit == 'number') {
                return await this.model.find(filter, projection, options || {}).sort(sort).skip(skip).limit(limit);
            }
            return await this.model.find(filter, projection, options || {}).sort(sort);
        } catch (error) {
            throw new Error(`Find failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateById(
        id: string | Types.ObjectId,
        data: UpdateQuery<T>,
        options?: QueryOptions & { session?: ClientSession }
    ): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(id, data, { ...options, new: true });
        } catch (error) {
            throw new Error(`UpdateById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateOne(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>,
        options?: QueryOptions & { session?: ClientSession }
    ): Promise<T | null> {
        try {
            return await this.model.findOneAndUpdate(filter, data, { ...options, new: true });
        } catch (error) {
            throw new Error(`UpdateOne failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deleteById(id: string | Types.ObjectId, options?: { session?: ClientSession }): Promise<T | null> {
        try {
            return await this.model.findByIdAndDelete(id, options || {});
        } catch (error) {
            throw new Error(`DeleteById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async startSession(): Promise<ClientSession> {
        return this.model.db.startSession();
    }
}
