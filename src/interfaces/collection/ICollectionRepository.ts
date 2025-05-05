import { ICollection } from "../../models/Collection";
import { IBaseRepository } from "../baseRepository/IBaseRepository";


export interface ICollectionRepository extends IBaseRepository<ICollection> {
    getCollections(userId?: string): Promise<ICollection[]>;
    getPendingRequests(): Promise<ICollection[]>
    getRevenueData(filters: {
        districtId?: string;
        serviceAreaId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        date: string;
        waste: number;
        scrap: number;
        total: number;
        wasteCollections: number;
        scrapCollections: number;
    }[]>;

}