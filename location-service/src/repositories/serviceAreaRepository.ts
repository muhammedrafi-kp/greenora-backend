import { IServiceAreaRepository } from "../interfaces/serviceArea/IServiceAreaRepository";
import ServiceArea, { IServiceArea } from "../models/ServiceArea";
import { BaseRepository } from "./baseRepository";

class ServiceAreaRepository extends BaseRepository<IServiceArea> implements IServiceAreaRepository {
    constructor() {
        super(ServiceArea);
    }
}

export default new ServiceAreaRepository();