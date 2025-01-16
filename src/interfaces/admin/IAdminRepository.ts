import { IAdmin } from "../../models/adminModel";

export interface IAdminRepository{
    createAdmin(adminData: Partial<IAdmin>): Promise<IAdmin>;
    findAdminByEmail(email:string):Promise<IAdmin|null>;
}