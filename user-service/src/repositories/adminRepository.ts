import Admin, { IAdmin } from '../models/Admin';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import { BaseRepository } from './baseRepository';
import Collector, { ICollector } from '../models/Collector';
import { AvailableCollectorDto } from "../dtos/response/availableCollectorDto.dto";

class AdminRepository extends BaseRepository<IAdmin> implements IAdminRepository {
    constructor() {
        super(Admin);
    }

    async getAvailableCollectors(serviceArea: string, dateKey: string): Promise<AvailableCollectorDto[]> {
        try {
            const collectors = await Collector.aggregate([
                {
                    $match: {
                        serviceArea: serviceArea
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        taskCount: {
                            $ifNull: [
                                { $toInt: { $ifNull: [`$dailyTaskCounts.${dateKey}`, 0] } },
                                0
                            ]
                        }
                    }
                }
            ]);

            return AvailableCollectorDto.fromList(collectors);
        } catch (error) {
            throw new Error(`Error while fetching available collectors:${error instanceof Error ? error.message : String(error)}`);
        }
    }

}

export default new AdminRepository();