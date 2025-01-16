import { Model, Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { IBaseRepository } from '../interfaces/baseRepository/IBaseRepository';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {

    constructor(protected readonly model: Model<T>) { };

    async create(data: Partial<T>): Promise<T> {
        try {
            const entity = new this.model(data);
            return await entity.save();
        } catch (error: unknown) {
            throw new Error(`Error while creating entity:${error instanceof Error ? error.message : String}`);
        }
    }

    async findById(id: string): Promise<T | null> {
        try {
            return await this.model.findById(id).exec();
        } catch (error: unknown) {
            throw new Error(`Error while finding entity by id : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        try {
            return this.model.findOne(filter).exec();
        } catch (error: unknown) {
            throw new Error(`Error while finding entity : ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async updateById(id: string, updateData: Partial<T>): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            throw new Error(`Error while updating entity :${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // async findAll(): Promise<T> {
    //     try {

    //     } catch (error) {

    //     }
    // }

    // async find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]> {
    //     try {

    //     } catch (error) {

    //     }
    // }
    // async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    //     try {

    //     } catch (error) {

    //     }
    // }

    // async delete(id: string): Promise<T | null> {
    //     try {

    //     } catch (error) {

    //     }
    // }
}