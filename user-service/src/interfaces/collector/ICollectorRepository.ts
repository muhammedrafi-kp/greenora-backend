import { ICollector } from "../../models/Collector";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface ICollectorRepository extends IBaseRepository<ICollector> {
    createCollector(collectorData: Partial<ICollector>): Promise<ICollector>;
}