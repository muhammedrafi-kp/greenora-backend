// import { IUser } from "../../models/User";
// import { ICollector } from "../../models/Collector";

// export interface IRedisRepository {
//     saveOtp(email: string, otp: string, ttl: number, prefix: string): Promise<void>;
//     getOtp(email: string, prefix: string): Promise<string | null>;
//     // deleteOtp(email: string): Promise<void>;
//     // isOtpValid(email: string, otp: string): Promise<boolean>;

//     // User Details Management
//     saveUserData(email: string, userData: IUser | ICollector, ttl: number, prefix: string): Promise<void>;
//     getUserData(email: string, prefix: string): Promise<IUser | ICollector>;
//     deleteUserData(email: string, prefix: string): Promise<void>;
//     // saveRefreshToken(id: string, refreshToken: string, ttl: number, prefix: string): Promise<void>;
//     // getRefreshToken(id: string, prefix: string): Promise<string>;
// }

export interface IRedisRepository {
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}