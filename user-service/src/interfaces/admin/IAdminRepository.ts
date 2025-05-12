import { IAdmin } from "../../models/Admin";
import { IBaseRepository } from "../baseRepository/IBaseRepository";
import { ICollector } from "../../models/Collector";

export interface IAdminRepository extends IBaseRepository<IAdmin> {
    createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin>;
    findAdminByEmail(email: string): Promise<IAdmin | null>;
    getAdminById(adminId: string): Promise<IAdmin | null>;
    getAvailableCollectors(serviceArea: string, dateKey: string): Promise<Partial<ICollector>[]>;
}