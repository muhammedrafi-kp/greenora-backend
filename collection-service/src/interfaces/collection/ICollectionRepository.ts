import { ICollection } from "../../models/Collection";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IRevenueData {
    date: string;
    waste: number;
    scrap: number;
    total: number;
    wasteCollections: number;
    scrapCollections: number;
}

export interface IRevenueQuery {
    preferredDate?: {
        $gte?: Date;
        $lte?: Date;
    };
    status: string;
}


export interface ICollectionRepository extends IBaseRepository<ICollection> {
    getCollections(userId?: string): Promise<ICollection[]>;
    getPendingRequests(): Promise<ICollection[]>
    getRevenueData(filters: {
        dateFilter: string;
        districtId?: string;
        serviceAreaId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<IRevenueData[]>;
    getCollectorRevenueData(collectorId: string, dateFilter: string, startDate?: string, endDate?: string): Promise<IRevenueData[]>;
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