import { Types, Model, Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { IBaseRepository } from '../interfaces/baseRepository/IBaseRepository';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {

    constructor(protected readonly model: Model<T>) { };

    async create(data: Partial<T>): Promise<T> {
        try {
            const entity = new this.model(data);
            return await entity.save();
        } catch (error) {
            throw new Error(`Create failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findById(id: string | Types.ObjectId, projection?: Record<string, number>): Promise<T | null> {
        try {
            return await this.model.findById(id, projection);
        } catch (error) {
            throw new Error(`FindById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        try {
            return await this.model.findOne(filter);
        } catch (error) {
            throw new Error(`FindOne failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async find(filter: FilterQuery<T> = {}, projection?: Record<string, number>, sort?: Record<string, 1 | -1>, skip?: number, limit?: number): Promise<T[]> {
        try {
            if (typeof skip == 'number' && typeof limit == 'number') {
                return await this.model.find(filter, projection).sort(sort).skip(skip).limit(limit);
            }
            return await this.model.find(filter, projection).sort(sort);
        } catch (error) {
            throw new Error(`Find failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateById(id: string | Types.ObjectId, data: UpdateQuery<T>, options: QueryOptions = {}): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(id, data, { ...options, new: true });
        } catch (error) {
            throw new Error(`UpdateById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
        try {
            return await this.model.findOneAndUpdate(filter, data, { ...options, new: true });
        } catch (error) {
            throw new Error(`UpdateOne failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deleteById(id: string | Types.ObjectId): Promise<T | null> {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`DeleteById failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
        try {
            return await this.model.countDocuments(filter);
        } catch (error) {
            throw new Error(`CountDocuments failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

}