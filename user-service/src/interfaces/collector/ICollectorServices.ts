import { ICollector } from "../../models/Collector";
import { SignupDto } from "../../dtos/request/auth.dto";
import { UpdateCollectorDto } from "../../dtos/request/collector.dto"
import { AuthDTo } from "../../dtos/response/auth.dto";
import { CollectorDto } from "../../dtos/response/collector.dto";

export interface ICollectorService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, collector: AuthDTo }>;
    signUp(collectorData: SignupDto): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, collector: AuthDTo }>;
    resendOtp(email: string): Promise<void>;
    sendResetPasswordLink(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    getCollectorBlockedStatus(collectorId: string): Promise<boolean>;
    handleGoogleAuth(credential: string): Promise<{ accessToken: string, refreshToken: string, collector: AuthDTo }>;

    getCollector(id: string): Promise<CollectorDto>;
    getCollectors(collectorIds: string[]): Promise<CollectorDto[]>;
    // updateCollector(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null>;
    updateCollector(
        collectorId: string,
        collectorData: UpdateCollectorDto,
        profileImage?: Express.Multer.File,
        idProofFront?: Express.Multer.File,
        idProofBack?: Express.Multer.File
    ): Promise<CollectorDto>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getAvailableCollector(serviceAreaId: string, preferredDate: string): Promise<{ success: boolean; collector: CollectorDto | null }>
    calculateCollectorScore(collector: ICollector, dateKey: string): Promise<number>;
    assignCollectionToCollector(collectorId: string, collectionId: string, preferredDate: string): Promise<void>;
    // cancelCollection(collectionId: string, collectorId: string, preferredDate: string): Promise<void>;
}