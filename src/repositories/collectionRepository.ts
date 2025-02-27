import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollection } from "../models/Collection";
import { BaseRepository } from "./baseRepository";
import PickupRequest from "../models/Collection";

class CollectionRepository extends BaseRepository<ICollection> implements ICollectionRepository {
    constructor() {
        super(PickupRequest);
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