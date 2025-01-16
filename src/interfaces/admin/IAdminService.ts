import { IAdmin } from "../../models/adminModel";

export interface IAdminService {
    login(email:string,password:string):Promise<{accessToken:string,refreshToken:string}>;
    createAdmin(email: string, password: string): Promise<IAdmin>;
}