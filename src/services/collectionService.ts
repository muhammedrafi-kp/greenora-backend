import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollectionservice } from "../interfaces/collection/ICollectionService";
import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { ICollection } from "../models/Collection";
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";
import { v4 as uuidv4 } from 'uuid';

export class CollectionService implements ICollectionservice {
    constructor(
        private collectionRepository: ICollectionRepository,
        private categoryRepository: ICategoryRepository,
        private redisRepository: IRedisRepository
    ) { };



    async validateCollectionData(userId: string, collectionData: Partial<ICollection>): Promise<{ success: boolean; message: string; collectionId: string; totalCost: number }> {
        try {
            if (!collectionData.items || collectionData.items.length === 0) {
                throw new Error("Items data is missing in the collection request.");
            }
            let totalCost = 0;

            for (const item of collectionData.items) {
                if (!item.categoryId || !item.qty) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const categoryData = await this.categoryRepository.findById(item.categoryId);

                if (!categoryData) {
                    throw new Error(`Category with ID ${item.categoryId} not found.`);
                }

                totalCost += categoryData.rate * Number(item.qty);
            }

            const collectionId = uuidv4().replace(/-/g, '').substring(0, 16);

            Object.assign(collectionData, { collectionId, estimatedCost: totalCost, });

            await this.redisRepository.set(userId, collectionData, 600);

            return {
                success: true,
                message: MESSAGES.COLLECTION_VALIDATED,
                collectionId,
                totalCost
            };

        } catch (error) {
            console.error('Error while validating collection data:', error);
            throw error;
        }
    }

    async createCollectionRequest(userId: string): Promise<ICollection> {
        try {

            let collectionData: ICollection | null = await this.redisRepository.get(userId);

            // Check if collectionData exists
            if (!collectionData) {
                throw new Error(`No collection data found in Redis for userId: ${userId}`);
            }

            collectionData.userId = userId

            console.log("Final collection data before saving:", collectionData);

            // Store collection data in the main repository (DB)
            const collection = await this.collectionRepository.create(collectionData);

            return collection;
        } catch (error) {
            console.error('Error while creating pickup request:', error);
            throw error;
        }
    }

    async getCollectionHistory(userId: string): Promise<ICollection[]> {
        try {
            return await this.collectionRepository.findAll({ userId });
        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }

    async getCollectionHistories(): Promise<ICollection[]> {
        try {
            return await this.collectionRepository.findAll({});
        } catch (error) {
            console.error('Error while fetching collection histories:', error);
            throw error;
        }
    }


}