import { IAdmin } from "../../models/Admin";

export interface IAdminRepository {
    createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin>;
    findAdminByEmail(email: string): Promise<IAdmin | null>;
    getAdminById(adminId: string): Promise<IAdmin | null>;
}