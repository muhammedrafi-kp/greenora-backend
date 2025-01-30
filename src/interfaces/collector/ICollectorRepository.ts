import { ICollector } from "../../models/Collector";

export interface ICollectorRepository {
    createCollector(collectorData: ICollector): Promise<ICollector>;
    findCollectorByEmail(email: string): Promise<ICollector | null>;
    getCollectorById(id: string): Promise<ICollector | null>;
    getCollectors(): Promise<ICollector[]>;
    updateCollectorById(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null>;
    updateStatusById(id: string, isBlocked: boolean): Promise<ICollector | null>;
}