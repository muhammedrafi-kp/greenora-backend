import { Decimal128 } from "mongoose";
import { ICollection } from "../../models/Collection";
import { ICollector } from "../external/external";

export interface IPayment {
    paymentId: string;
    advanceAmount: number;
    advancePaymentStatus: string;
    amount: number;
    status: "pending" | "success" | "failed";
    method: "wallet" | "online" | "cash";
    paymentDate: string;
}

export interface ICollectionservice {
    validateCollection(userId: String, collectionData: ICollection): Promise<string>;

    createCollection(userId: string, paymentId: string): Promise<ICollection>;

    scheduleCollection(collectionId: string, userId: string, serviceAreaId: string, preferredDate: string): Promise<void>;

    scheduleCollectionManually(collectionId: string, collectorId: string, userId: string, preferredDate: string): Promise<void>;
    getCollectionHistory(userId: string): Promise<ICollection[]>;

    getCollectionHistories(options: {
        status?: string;
        districtId?: string;
        serviceAreaId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{collections: Partial<ICollection>[], totalItems: number}>;
    findAvailableCollector(serviceAreaId: string, preferredDate: string): Promise<ICollector>;
    assignCollectionToCollector(collectionId: string, collectorId: string, preferredDate: string): Promise<void>;
    
    getAssignedCollections(collectorId: string): Promise<Partial<ICollection>[]>;
    processCashPayment(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentData: IPayment): Promise<void>;
    processDigitalPayment(collectionId: string, collectionData: Partial<ICollection>,collectionProofs: Express.Multer.File[], paymentData: IPayment): Promise<void>;
    cancelCollection(collectionId: string, reason: string): Promise<void>;
    requestCollectionPayment(collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[]): Promise<void>;
}