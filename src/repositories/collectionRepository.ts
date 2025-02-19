import { ICollectionRepository } from "../interfaces/collection/ICollectionRepository";
import { ICollection } from "../models/Collection";
import { BaseRepository } from "./baseRepository";
import PickupRequest from "../models/Collection";

class CollectionRepository extends BaseRepository<ICollection> implements ICollectionRepository{
    constructor(){
        super(PickupRequest);
    }
}

export default new CollectionRepository();