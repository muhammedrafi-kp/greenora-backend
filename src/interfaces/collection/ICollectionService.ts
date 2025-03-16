import { Decimal128 } from "mongoose";
import { ICollection } from "../../models/Collection";

export interface ICollectionservice {
    validateCollectionData(userId: string, collectionData: Partial<ICollection>): Promise<{ success: boolean; message: string; collectionId: string; totalCost: number }>;
    createCollectionRequest(userId: string): Promise<{ success: boolean, message: string, data: ICollection }>;

    validateCollection(userId:String,collectionData:ICollection):Promise<string>;
    createCollection(userId: string,paymentId:string):Promise<ICollection>;

    getCollectionHistory(userId: string): Promise<ICollection[]>;
    getCollectionHistories(): Promise<Partial<ICollection>[]>;

    getAvailableCollectors(serviceAreaId: string): Promise<{ success: true, collectors: object[] }>
    // processPendingRequests(): Promise<ICollection[]>;
    processPendingRequests(): Promise<void>;
    assignCollectorToRequest(request: ICollection): Promise<void>;
    getAssignedCollections(collectorId:string): Promise<Partial<ICollection>[]>;
}