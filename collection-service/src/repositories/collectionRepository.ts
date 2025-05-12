import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollection } from "../models/Collection";
import { BaseRepository } from "./baseRepository";
import PickupRequest from "../models/Collection";

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
        districtId?: string;
        serviceAreaId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        date: string;
        waste: number;
        scrap: number;
        total: number;
        wasteCollections:
        number; scrapCollections: number;
    }[]> {
        try {
            const { districtId, serviceAreaId, startDate, endDate } = filters;

            const query: any = {
                status: 'completed',
                $or: [
                    { type: 'waste' },
                    { type: 'scrap' }
                ]
            };

            if (districtId && districtId !== 'all') {
                query.districtId = districtId;
            }

            if (serviceAreaId && serviceAreaId !== 'all') {
                query.serviceAreaId = serviceAreaId;
            }

            if (startDate && endDate) {
                query.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            } else if (startDate) {
                query.createdAt = { $gte: startDate };
            } else if (endDate) {
                query.createdAt = { $lte: endDate };
            }

            // Group by date and type
            const aggregation = await this.model.aggregate([
                {
                    $match: query
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            type: "$type"
                        },
                        totalAmount: { $sum: "$estimatedCost" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        waste: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.type", "waste"] }, "$totalAmount", 0]
                            }
                        },
                        scrap: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.type", "scrap"] }, "$totalAmount", 0]
                            }
                        },
                        wasteCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.type", "waste"] }, "$count", 0]
                            }
                        },
                        scrapCollections: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.type", "scrap"] }, "$count", 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        date: "$_id",
                        waste: 1,
                        scrap: 1,
                        total: { $subtract: ["$waste", "$scrap"] },
                        wasteCollections: 1,
                        scrapCollections: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { date: 1 }
                }
            ]);

            return aggregation;

        } catch (error) {
            throw new Error(`Error fetching revenue data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


}

export default new CollectionRepository();