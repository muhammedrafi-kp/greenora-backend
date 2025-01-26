import { IAdmin } from "../../models/AdminModel";
import { IUser } from "../../models/UserModel";
import { ICollector } from "../../models/CollectorModel";

export interface IAdminService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string }>;
    createAdmin(email: string, password: string): Promise<IAdmin>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    // getUsers(search: string, filter: string, sort: string, page: number, limit: number): Promise<IUser[]>;
    getUsers(): Promise<IUser[]>;
    getCollectors(): Promise<ICollector[]>;
    updateUserStatus(id: string): Promise<string>;
    updateCollectorStatus(id: string): Promise<string>;
}