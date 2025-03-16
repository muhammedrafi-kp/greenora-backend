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
            // return this.model.find({ userId })
            // .populate({
            //   path: 'items.categoryId',
            //   model: 'Category',
            //   select: 'name rate',
            // })
            // .lean()
            // .exec() as unknown as ICollection[];
            return await this.model.find({ userId }).populate({
                path: "items.categoryId", // populate inside array
                model: "Category",         // your category model name
                select: "name"   // fields you want to include, exclude _id if needed
            });

        } catch (error) {
            throw new Error(`Error while finding pending collection requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async getPendingRequests(): Promise<ICollection[]> {
        try {
            const filter = { status: "pending" };
            // const sort = { preferredDate: 1 };
            return this.findAll(filter, {}, { preferredDate: 1 });
        } catch (error) {
            throw new Error(`Error while finding pending collection requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


}

export default new CollectionRepository();