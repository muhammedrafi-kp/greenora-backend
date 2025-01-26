import { ICollector } from "../../models/CollectorModel"

export interface ICollectorService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    signUp(collectorData: ICollector): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    resendOtp(email: string): Promise<void>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    getCollector(id: string): Promise<ICollector>;
    updateCollector(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null>;
}