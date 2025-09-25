import { ICollection } from "../../models/Collection";
// import { ISetting } from "../../models/Settings";
import { IBaseRepository } from "../baseRepository/IBaseRepository";
import { ICollectionChartData,ICollectorCollectionChartData } from "../../dtos/response/collectionChart.dto";

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

    getCollectionChartData(): Promise<ICollectionChartData>;
    getCollectorCollectionChartData(collectorId: string): Promise<ICollectorCollectionChartData>;
    // updateRevenuePercentage(value:number,updatedBy:string): Promise<ISetting>;
}