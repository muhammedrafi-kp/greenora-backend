import { BaseRepository } from "./baseRepository";
import Collector, { ICollector } from "../models/collectorModel";
import { ICollectorRepository } from "../interfaces/collector/ICollectorRepository";

class CollectorRepository extends BaseRepository<ICollector> implements ICollectorRepository {

    constructor() {
        super(Collector);
    }

    async createCollector(collectorData: ICollector): Promise<ICollector> {
        try {
            return await this.model.create(collectorData);
        } catch (error: unknown) {
            throw new Error(`Error while creating user : ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    async findCollectorByEmail(email: string): Promise<ICollector | null> {
        try {
            return await this.model.findOne({ email });
        } catch (error) {
            throw new Error(`Error while finding collector : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getCollectorById(id: string): Promise<ICollector | null> {
        try {
            return await this.model.findById(id);
        } catch (error) {
            throw new Error(`Error while finding collector:${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new CollectorRepository();