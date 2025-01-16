import { ICollector } from "../../models/collectorModel";

export interface ICollectorRepository{
    createCollector(collectorData:ICollector):Promise<ICollector>;
    findCollectorByEmail(email:string):Promise<ICollector|null>;
    getCollectorById(id: string): Promise<ICollector | null>;

}