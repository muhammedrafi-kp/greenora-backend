import { ICollector } from "../../models/collectorModel"

export interface ICollectorService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    signUp(collectorData: ICollector): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    resendOtp(email:string):Promise<void>;
    getCollector(id: string): Promise<ICollector>;
}