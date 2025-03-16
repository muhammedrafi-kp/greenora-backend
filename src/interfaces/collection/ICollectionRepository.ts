import { ICollection } from "../../models/Collection";
import { IBaseRepository } from "../baseRepository/IBaseRepository";


export interface ICollectionRepository extends IBaseRepository<ICollection>{
    getCollections(userId?:string):Promise<ICollection[]>;
    getPendingRequests(): Promise<ICollection[]>
}