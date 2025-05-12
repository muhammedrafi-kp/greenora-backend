import { ICollector } from "../../models/Collector";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface ICollectorRepository extends IBaseRepository<ICollector> {
    createCollector(collectorData: Partial<ICollector>): Promise<ICollector>;
    getCollectorByEmail(email: string): Promise<ICollector | null>;
    getCollectorById(id: string): Promise<ICollector | null>;
    getCollectors(): Promise<ICollector[]>;
    updateCollectorById(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null>;
    updateStatusById(id: string, isBlocked: boolean): Promise<ICollector | null>;
}