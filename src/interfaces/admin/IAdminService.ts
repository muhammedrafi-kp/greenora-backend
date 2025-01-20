import { IAdmin } from "../../models/adminModel";
import { IUser } from "../../models/userModel";
import { ICollector } from "../../models/collectorModel";

export interface IAdminService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string }>;
    createAdmin(email: string, password: string): Promise<IAdmin>;
    // getUsers(search: string, filter: string, sort: string, page: number, limit: number): Promise<IUser[]>;
    getUsers(): Promise<IUser[]>;
    getCollectors(): Promise<ICollector[]>;
    updateUserStatus(id: string): Promise<string>;
    updateCollectorStatus(id: string): Promise<string>;
}