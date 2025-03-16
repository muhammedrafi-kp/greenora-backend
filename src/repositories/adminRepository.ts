import Admin, { IAdmin } from '../models/Admin';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import { BaseRepository } from './baseRepository';
// import { IUser } from '../models/User';

class AdminRepository extends BaseRepository<IAdmin> implements IAdminRepository {
    constructor() {
        super(Admin);
    }

    async createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin> {
        try {
            return await this.create(adminData);
        } catch (error: unknown) {
            throw new Error(`Error while creating admin : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findAdminByEmail(email: string): Promise<IAdmin | null> {
        try {
            return await this.findOne({ email });
        } catch (error: unknown) {
            throw new Error(`Error while finding admin : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getAdminById(adminId: string): Promise<IAdmin | null> {
        try {
            return await this.findById(adminId);
        } catch (error) {
            throw new Error(`Error while finding admin:${error instanceof Error ? error.message : String(error)}`);
        }
    }


}

export default new AdminRepository();