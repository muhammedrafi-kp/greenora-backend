import { Types, Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { IBaseRepository } from '../interfaces/baseRepository/IBaseRepository';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    constructor(protected readonly model: Model<T>) { };

    async create(data: Partial<T>): Promise<T> {
        try {
            const entity = new this.model(data);
            return await entity.save();
        } catch (error) {
            throw new Error(`Create fialed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findById(id: string | Types.ObjectId): Promise<T | null> {
        try {
            return await this.model.findById(id);
        } catch (error) {
            throw new Error(`findById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        try {
            return await this.model.findOne(filter);
        } catch (error) {
            throw new Error(`findOne is failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async find(filter: FilterQuery<T> = {}, projection?: Record<string, number>): Promise<T[]> {
        try {
            return await this.model.find(filter, projection);
        } catch (error) {
            throw new Error(`Find failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateById(id: string | Types.ObjectId, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(id, data, { ...options, new: true });
        } catch (error) {
            throw new Error(`UpdateById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deleteById(id: string | Types.ObjectId): Promise<T | null> {
        try {
            return this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`DeleteById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
