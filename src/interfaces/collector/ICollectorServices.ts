import { ICollector } from "../../models/Collector";

export interface ICollectorService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    signUp(collectorData: ICollector): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;
    resendOtp(email: string): Promise<void>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    handleGoogleAuth(credential: string): Promise<{ accessToken: string, refreshToken: string, collector: ICollector }>;

    getCollector(id: string): Promise<ICollector>;
    getCollectors(collectorIds: string[]): Promise<ICollector[]>;
    updateCollector(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getAvailableCollector(serviceAreaId: string, preferredDate: string): Promise<{ success: boolean; collector: Partial<ICollector>|null }>
    calculateCollectorScore(collector: ICollector, dateKey: string): Promise<number>;
    assignCollectionToCollector(collectorId: string, collectionId: string, preferredDate: string): Promise<void>;
    deductTaskCount(collectorId:string):Promise<void>;
}