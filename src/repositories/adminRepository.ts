import Admin, { IAdmin } from '../models/adminModel'
import { IAdminRepository } from '../interfaces/admin/IAdminRepository'
import { BaseRepository } from './baseRepository'

class AdminRepository extends BaseRepository<IAdmin> implements IAdminRepository {
    constructor() {
        super(Admin);
    }

    async createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin> {
        try {
            return await this.model.create(adminData);
        } catch (error: unknown) {
            throw new Error(`Error while creating admin : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findAdminByEmail(email: string): Promise<IAdmin | null> {
        try {
            return await this.model.findOne({ email });
        } catch (error: unknown) {
            throw new Error(`Error while creating admin : ${error instanceof Error ? error.message : String(error)}`);
        }

    }
}

export default new AdminRepository();