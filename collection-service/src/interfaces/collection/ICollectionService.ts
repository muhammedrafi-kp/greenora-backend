import { CollectionDto } from "../../dtos/response/collection.dto";
import { ICollection } from "../../models/Collection";
import { ICollector } from "../../dtos/external/external";

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
    initiateRazorpayAdvance(userId: string, collectionData: Partial<ICollection>): Promise<{ orderId: string, amount: number }>;
    verifyRazorpayAdvance(userId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void>;
    verifyRazorpayPayment(collectionId: string, razorpayVerificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }): Promise<void>;
    unlockPaymentLock(userId: string): Promise<void>;

    validateCollection(collectionData: Partial<ICollection>): Promise<number>;
    requestCollectionPayment(collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[]): Promise<void>;
    payAdvanceWithWallet(userId: string, collectionData: Partial<ICollection>): Promise<void>;
    payWithWallet(userId: string, collectionId: string): Promise<void>;

    createCollection(userId: string, paymentId: string): Promise<ICollection>;

    scheduleCollection(collectionId: string, userId: string, serviceAreaId: string, preferredDate: string): Promise<void>;
    scheduleCollectionManually(collectionId: string, collectorId: string, userId: string, preferredDate: string): Promise<void>;
    getCollection(collectionId: string): Promise<CollectionDto | null>;
    getCollectionHistory(userId: string, options: {
        status?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
    }): Promise<CollectionDto[]>;

    updateCollection(collectionId: string, collectionData: Partial<ICollection>): Promise<ICollection | null>
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
    }): Promise<{ collections: CollectionDto[], totalItems: number }>;
    findAvailableCollector(serviceAreaId: string, preferredDate: string): Promise<ICollector | null>;
    assignCollectionToCollector(collectionId: string, collectorId: string, preferredDate: string): Promise<void>;

    getAssignedCollections(collectorId: string, options: {
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }):Promise<{ collections: CollectionDto[], totalItems: number }>;
    completeCollection(collectionId: string, collectionData: Partial<ICollection>, collectionProofs: Express.Multer.File[], paymentMethod: string): Promise<void>;
    // processWithDigitalPayment(collectionId: string,  paymentId: string): Promise<void>;
    cancelCollection(collectionId: string, reason: string): Promise<void>;
    getRevenueData(options: {
        districtId?: string;
        serviceAreaId?: string;
        dateFilter: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        date: string;
        waste: number;
        scrap: number;
        total: number;
        wasteCollections: number;
        scrapCollections: number;
    }[]>

    getCollectorRevenueData(options: {
        collectorId: string;
        dateFilter: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        date: string;
        waste: number;
        scrap: number;
        total: number;
        wasteCollections: number;
        scrapCollections: number;
    }[]>

    getDashboardData(): Promise<{
        totalCollections: number;
        totalRevenue: number;
        totalWasteCollections: number;
        totalScrapCollections: number;
    }>

    getCollectorDashboardData(collectorId: string): Promise<{
        totalCollections: number;
        totalRevenue: number;
        totalWasteCollections: number;
        totalScrapCollections: number;
    }>
}