import { BaseRepository } from "./baseRepository";
import Collector, { ICollector, Counter } from "../models/Collector";
import { ICollectorRepository } from "../interfaces/collector/ICollectorRepository";

class CollectorRepository extends BaseRepository<ICollector> implements ICollectorRepository {

    constructor() {
        super(Collector);
    }

    async createCollector(collectorData: ICollector): Promise<ICollector> {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "collectorId" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            collectorData.collectorId = `COL${counter.seq}`;

            return await this.model.create(collectorData);
        } catch (error: unknown) {
            throw new Error(`Error while creating user : ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new CollectorRepository();