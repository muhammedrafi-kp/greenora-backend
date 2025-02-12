import { IServiceAreaRepository } from "../interfaces/IServiceAreaRepository";
import ServiceArea, { IServiceArea } from "../models/ServiceArea";
import { BaseRepository } from "./baseRepository";

class ServiceAreaRepository extends BaseRepository<IServiceArea> implements IServiceAreaRepository {
    constructor() {
        super(ServiceArea);
    }

    // async createServiceArea(serviceAreaData: IServiceArea): Promise<IServiceArea> {
    //     try {
    //         return await this.create(serviceAreaData);
    //     } catch (error) {
    //         throw new Error(`Error while creating serviceArea : ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }

    async findServiceAreaById(serviceAreaId: string): Promise<IServiceArea | null> {
        try {
            return await this.findById(serviceAreaId);
        } catch (error) {
            throw new Error(`Error while finding service area: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findAllServiceAreas(): Promise<IServiceArea[]> {
        try {
            return await this.find();
        } catch (error) {
            throw new Error(`Error while finding service areas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new ServiceAreaRepository();