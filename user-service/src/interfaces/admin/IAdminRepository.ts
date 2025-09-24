import { IAdmin } from "../../models/Admin";
import { IBaseRepository } from "../baseRepository/IBaseRepository";
import { ICollector } from "../../models/Collector";
import { AvailableCollectorDto } from "../../dtos/response/availableCollectorDto.dto"

export interface IAdminRepository extends IBaseRepository<IAdmin> {
    getAvailableCollectors(serviceArea: string, dateKey: string): Promise<AvailableCollectorDto[]>;
}