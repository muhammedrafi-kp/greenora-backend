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


    async getCollectorByEmail(email: string): Promise<ICollector | null> {
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

    async getCollectors(): Promise<ICollector[]> {
        try {
            const projection = {
                name: 1,
                email: 1,
                phone: 1,
                profileUrl: 1,
                idProofFrontUrl: 1,
                idProofBackUrl: 1,
                district: 1,
                serviceArea: 1,
                verificationStatus: 1,
                isVerified: 1,
                isBlocked: 1
            };
            return await this.find({}, projection);
        } catch (error: unknown) {
            throw new Error(`Error while creating admin : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateCollectorById(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null> {
        try {
            return await this.updateById(id, collectorData);
        } catch (error) {
            throw new Error(`Error while updating collector:${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateStatusById(id: string, isBlocked: boolean): Promise<ICollector | null> {
        try {
            return await this.updateById(id, { isBlocked } as Partial<ICollector>);
        } catch (error) {
            throw new Error(`Error while updating user status : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

}

export default new CollectorRepository();