import { IUser } from "../../models/userModel";
import { ICollector } from "../../models/collectorModel";

export interface IRedisRepository {
    saveOtp(email: string, otp: string, ttl: number, prefix: string): Promise<void>;
    getOtp(email: string, prefix: string): Promise<string | null>;
    // deleteOtp(email: string): Promise<void>;
    // isOtpValid(email: string, otp: string): Promise<boolean>;

    // User Details Management
    saveUserData(email: string, userData: IUser | ICollector, prefix: string): Promise<void>;
    getUserData(email: string, prefix: string): Promise<IUser | ICollector>;
    deleteUserData(email: string, prefix: string): Promise<void>;
    // saveRefreshToken(id: string, refreshToken: string, ttl: number, prefix: string): Promise<void>;
    // getRefreshToken(id: string, prefix: string): Promise<string>;
}