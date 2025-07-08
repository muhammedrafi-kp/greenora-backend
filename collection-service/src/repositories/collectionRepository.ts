import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollection } from "../models/Collection";
import { BaseRepository } from "./baseRepository";
import PickupRequest from "../models/Collection";
import { Types } from "mongoose";

interface IRevenueData {
    date: string;
    waste: number;
    scrap: number;
    total: number;
    wasteCollections: number;
    scrapCollections: number;
}

interface RevenueQuery {
    preferredDate?: {
        $gte?: Date;
        $lte?: Date;
    };
    status: string;
    districtId?: string;
    serviceAreaId?: string;
}

interface ICollectorRevenueQuery {
    collectorId?: Types.ObjectId;
    preferredDate?: {
        $gte?: Date;
        $lte?: Date;
    };
    status: string;
}

class CollectionRepository extends BaseRepository<ICollection> implements ICollectionRepository {
    constructor() {
        super(PickupRequest);
    }

    async getCollections(userId: string): Promise<ICollection[]> {
        try {
            return await this.model.find({ userId }).populate({
                path: "items.categoryId", // populate inside array
                model: "Category",         // your category model name
                select: "name"   // fields you want to include, exclude _id if needed
            }).sort({ createdAt: -1 });

        } catch (error) {
            throw new Error(`Error while finding pending collection requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async getPendingRequests(): Promise<ICollection[]> {
        try {
            const filter = { status: "pending" };
            return this.findAll(filter, {}, { preferredDate: 1 });
        } catch (error) {
            throw new Error(`Error while finding pending collection requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getRevenueData(filters: {
        dateFilter: string;
        districtId?: string;
        serviceAreaId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<IRevenueData[]> {
        try {
            console.log("filters :", filters);
            const { dateFilter, districtId, serviceAreaId, startDate, endDate } = filters;
            const query: RevenueQuery = { status: "completed" };

            // Add districtId filter if provided
            if (districtId) {
                query.districtId = districtId;
            }

            // Add serviceAreaId filter if provided
            if (serviceAreaId) {
                query.serviceAreaId = serviceAreaId;
            }

            // Date helper functions
            const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
            const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));
            const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
            const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
            const getLastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const getFirstDayOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
            const getLastDayOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31);

            // Set date range based on filter
            const now = new Date();
            let dateRange: { start: Date; end: Date } | null = null;
            let groupByFormat = "%Y-%m-%d";

            switch (dateFilter) {
                case "today":
                    dateRange = {
                        start: getStartOfDay(new Date(now)),
                        end: getEndOfDay(new Date(now))
                    };
                    break;
                case "yesterday":
                    const yesterday = addDays(now, -1);
                    dateRange = {
                        start: getStartOfDay(new Date(yesterday)),
                        end: getEndOfDay(new Date(yesterday))
                    };
                    break;
                case "last7days":
                    dateRange = {
                        start: getStartOfDay(addDays(now, -7)),
                        end: getEndOfDay(new Date(now))
                    };
                    break;
                case "thismonth":
                    dateRange = {
                        start: getFirstDayOfMonth(now),
                        end: getLastDayOfMonth(now)
                    };
                    break;
                case "lastmonth":
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    dateRange = {
                        start: getFirstDayOfMonth(lastMonth),
                        end: getLastDayOfMonth(lastMonth)
                    };
                    break;
                case "thisyear":
                    dateRange = {
                        start: getFirstDayOfYear(now),
                        end: getLastDayOfYear(now)
                    };
                    groupByFormat = "%Y-%m";
                    break;
                case "custom":
                    if (startDate && endDate) {
                        dateRange = {
                            start: getStartOfDay(new Date(startDate)),
                            end: getEndOfDay(new Date(endDate))
                        };
                    }
                    break;
                default:
                    dateRange = {
                        start: getStartOfDay(new Date(now)),
                        end: getEndOfDay(new Date(now))
                    };
            }

            if (dateRange) {
                query.preferredDate = {
                    $gte: dateRange.start,
                    $lte: dateRange.end
                };
            }

            const revenueData = await this.model.aggregate([
                { $match: query },
                {
                    $project: {
                        date: { $dateToString: { format: groupByFormat, date: "$preferredDate" } },
                        type: 1,
                        revenue: { $multiply: ["$payment.amount", 0.75] }, // 75% of payment amount
                        isWaste: { $eq: ["$type", "waste"] },
                        isScrap: { $eq: ["$type", "scrap"] }
                    }
                },
                {
                    $group: {
                        _id: "$date",
                        waste: { $sum: { $cond: [{ $eq: ["$type", "waste"] }, "$revenue", 0] } },
                        scrap: { $sum: { $cond: [{ $eq: ["$type", "scrap"] }, "$revenue", 0] } },
                        total: { $sum: "$revenue" },
                        wasteCollections: { $sum: { $cond: ["$isWaste", 1, 0] } },
                        scrapCollections: { $sum: { $cond: ["$isScrap", 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return dateRange ? this.fillMissingDates(revenueData, dateRange, groupByFormat) : [];


        } catch (error) {
            throw new Error(`Error fetching revenue data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async getCollectorRevenueData(collectorId: string, dateFilter: string, startDate?: string, endDate?: string): Promise<IRevenueData[]> {
        const query: ICollectorRevenueQuery = { status: "completed" };
        query.collectorId = new Types.ObjectId(collectorId);
        let groupByFormat = "%Y-%m-%d";
        let dateRange: { start: Date; end: Date } | null = null;

        // Helper functions
        const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
        const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));
        const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
        const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
        const getLastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const getFirstDayOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
        const getLastDayOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31);

        // Set date range based on filter
        const now = new Date();
        switch (dateFilter) {
            case "today":
                dateRange = {
                    start: getStartOfDay(new Date(now)),
                    end: getEndOfDay(new Date(now))
                };
                break;
            case "yesterday":
                const yesterday = addDays(now, -1);
                dateRange = {
                    start: getStartOfDay(new Date(yesterday)),
                    end: getEndOfDay(new Date(yesterday))
                };
                break;
            case "last7days":
                dateRange = {
                    start: getStartOfDay(addDays(now, -7)),
                    end: getEndOfDay(new Date(now))
                };
                break;
            case "thismonth":
                dateRange = {
                    start: getFirstDayOfMonth(now),
                    end: getLastDayOfMonth(now)
                };
                break;
            case "lastmonth":
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                dateRange = {
                    start: getFirstDayOfMonth(lastMonth),
                    end: getLastDayOfMonth(lastMonth)
                };
                break;
            case "thisyear":
                dateRange = {
                    start: getFirstDayOfYear(now),
                    end: getLastDayOfYear(now)
                };
                groupByFormat = "%Y-%m"; // Group by month for yearly view
                break;
            case "custom":
                if (startDate && endDate) {
                    dateRange = {
                        start: getStartOfDay(new Date(startDate)),
                        end: getEndOfDay(new Date(endDate))
                    };
                }
                break;
            default:
                dateRange = {
                    start: getStartOfDay(new Date(now)),
                    end: getEndOfDay(new Date(now))
                };
        }

        if (dateRange) {
            query.preferredDate = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }


        // Aggregate to get revenue data
        const revenueData = await this.model.aggregate([
            { $match: query },
            {
                $project: {
                    date: { $dateToString: { format: groupByFormat, date: "$preferredDate" } },
                    type: 1,
                    revenue: { $multiply: ["$payment.amount", 0.15] }, // 15% of payment amount
                    isWaste: { $eq: ["$type", "waste"] },
                    isScrap: { $eq: ["$type", "scrap"] }
                }
            },
            {
                $group: {
                    _id: "$date",
                    waste: { $sum: { $cond: [{ $eq: ["$type", "waste"] }, "$revenue", 0] } },
                    scrap: { $sum: { $cond: [{ $eq: ["$type", "scrap"] }, "$revenue", 0] } },
                    total: { $sum: "$revenue" },
                    wasteCollections: { $sum: { $cond: ["$isWaste", 1, 0] } },
                    scrapCollections: { $sum: { $cond: ["$isScrap", 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing dates with zero values
        return dateRange ? this.fillMissingDates(revenueData, dateRange, groupByFormat) : [];
    }

    private fillMissingDates(data: any[], dateRange: { start: Date; end: Date }, format: string): IRevenueData[] {
        const result: IRevenueData[] = [];
        const dateMap = new Map(data.map(item => [item._id, item]));

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        if (format === "%Y-%m") {
            // Monthly grouping
            for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
                const startMonth = (year === start.getFullYear()) ? start.getMonth() : 0;
                const endMonth = (year === end.getFullYear()) ? end.getMonth() : 11;

                for (let month = startMonth; month <= endMonth; month++) {
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                    this.addDateToResult(dateKey, dateMap, result);
                }
            }
        } else {
            // Daily grouping
            const current = new Date(start);
            while (current <= end) {
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`;
                this.addDateToResult(dateKey, dateMap, result);
                current.setDate(current.getDate() + 1);
            }
        }

        return result;
    }

    private addDateToResult(dateKey: string, dateMap: Map<string, any>, result: IRevenueData[]) {
        if (dateMap.has(dateKey)) {
            const item = dateMap.get(dateKey);
            result.push({
                date: dateKey,
                waste: item.waste,
                scrap: item.scrap,
                total: item.total,
                wasteCollections: item.wasteCollections,
                scrapCollections: item.scrapCollections
            });
        } else {
            result.push({
                date: dateKey,
                waste: 0,
                scrap: 0,
                total: 0,
                wasteCollections: 0,
                scrapCollections: 0
            });
        }
    }


    async getDashboardData(): Promise<{
        totalCollections: number;
        totalRevenue: number;
        totalWasteCollections: number;
        totalScrapCollections: number;
    }> {
        try {
            const result = await this.model.aggregate([
                { 
                    $match: { 
                        status: "completed" 
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalCollections: { $sum: 1 },
                        totalRevenue: { 
                            $sum: { 
                                $multiply: ["$payment.amount", 0.75] 
                            } 
                        },
                        wasteCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "waste"] }, 1, 0]
                            }
                        },
                        scrapCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "scrap"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCollections: 1,
                        totalRevenue: 1,
                        wasteCollections: 1,
                        scrapCollections: 1
                    }
                }
            ]);
    
            // If no collections exist, return zeros
            return result[0] || {
                totalCollections: 0,
                totalRevenue: 0,
                wasteCollections: 0,
                scrapCollections: 0
            };
        } catch (error) {
            throw new Error(`Error fetching dashboard data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async getCollectorDashboardData(collectorId: string): Promise<{
        totalCollections: number;
        totalRevenue: number;
        totalWasteCollections: number;
        totalScrapCollections: number;
    }> {
        try {
            const result = await this.model.aggregate([
                { 
                    $match: { 
                        status: "completed",
                        collectorId: new Types.ObjectId(collectorId)
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalCollections: { $sum: 1 },
                        totalRevenue: { 
                            $sum: { 
                                $multiply: ["$payment.amount", 0.15] 
                            } 
                        },
                        wasteCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "waste"] }, 1, 0]
                            }
                        },
                        scrapCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "scrap"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalCollections: 1,
                        totalRevenue: 1,
                        wasteCollections: 1,
                        scrapCollections: 1
                    }
                }
            ]);
    
            return result[0] || {
                totalCollections: 0,
                totalRevenue: 0,
                wasteCollections: 0,
                scrapCollections: 0
            };
        } catch (error) {
            throw new Error(`Error fetching collector dashboard data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
}

export default new CollectionRepository();