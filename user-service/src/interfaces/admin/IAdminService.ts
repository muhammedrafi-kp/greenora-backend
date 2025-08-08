import { IAdmin } from "../../models/Admin";
import { IUser } from "../../models/User";
import { ICollector } from "../../models/Collector";
import { IDistrict } from "../../interfaces/external/locationService";
import { IServiceArea } from "../../interfaces/external/locationService";
import { AuthDTo } from "../../dtos/response/auth.dto";
import { UserDto } from "../../dtos/response/user.dto";

export interface IAdminService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, admin: AuthDTo }>;
    createAdmin(email: string, password: string): Promise<AuthDTo>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    getUsers(queryOptions: {
        search?: string;
        status?: string;
        sortField?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }): Promise<{ users: UserDto[], totalItems: number, totalPages: number }>;

    getCollector(collectorId: string): Promise<ICollector>;

    getCollectors(queryOptions: {
        search?: string;
        status?: string;
        district?: string;
        serviceArea?: string;
        sortField?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }): Promise<{ collectors: Partial<ICollector>[], totalItems: number, totalPages: number }>;

    getAvailableCollectors(serviceArea: string, preferredDate: string): Promise<Partial<ICollector>[]>;

    getVerificationRequests(): Promise<ICollector[]>;
    updateVerificationStatus(id: string, status: string): Promise<ICollector | null>;
    updateUserStatus(id: string): Promise<string>;
    updateCollectorStatus(id: string): Promise<string>;
    getDistrictsByIds(districtIds: string[]): Promise<IDistrict[]>;
    getServiceAreasByIds(serviceAreaIds: string[]): Promise<IServiceArea[]>
}