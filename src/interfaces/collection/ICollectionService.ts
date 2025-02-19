import { Decimal128 } from "mongoose";
import { ICollection } from "../../models/Collection";

export interface ICollectionservice {
    validateCollectionData(userId: string, collectionData: Partial<ICollection>): Promise<{ success: boolean; message: string; collectionId: string; totalCost: number }>;
    createCollectionRequest(userId: string): Promise<ICollection>;
    getCollectionHistory(userId: string): Promise<ICollection[]>;
    getCollectionHistories(): Promise<ICollection[]>;
}