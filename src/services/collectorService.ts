import { ICollectorService } from "../interfaces/collector/ICollectorServices";
import { ICollectorRepository } from "../interfaces/collector/ICollectorRepository";
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { ICollector } from "../models/Collector";
import bcrypt from "bcrypt";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";
import { generateAccessToken, generateRefreshToken,verifyToken } from "../utils/token";
import OTP from "otp-generator";
import { sendOtp } from "../utils/mail";

export class CollectorService implements ICollectorService {
    constructor(
        private collectorRepository: ICollectorRepository,
        private redisRepository: IRedisRepository,
    ) { };

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; collector: ICollector; }> {
        try {
            const collector = await this.collectorRepository.findCollectorByEmail(email);

            if (!collector) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const isCorrectPassword = await bcrypt.compare(password, collector.password);

            if (!isCorrectPassword) {
                const error: any = new Error(MESSAGES.INVALID_PASSWORD);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const accessToken = generateAccessToken(collector._id as string, 'collector');
            const refreshToken = generateRefreshToken(collector._id as string, 'collector');

            return { accessToken, refreshToken, collector };

        } catch (error) {
            console.error('Error while creating collector:', error);
            throw error;
        }
    };

    async signUp(collectorData: ICollector): Promise<void> {
        try {
            const { email } = collectorData;

            const existingCollector = await this.collectorRepository.findCollectorByEmail(email);

            if (existingCollector) {
                const error: any = new Error("Email already exists!");
                error.status = HTTP_STATUS.CONFLICT;
                throw error;
            }

            const prefix = "collector";
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            await sendOtp(email, otp);
            await this.redisRepository.saveOtp(email, otp, 35, prefix);
            await this.redisRepository.saveUserData(email, collectorData, 86400, prefix);
        } catch (error) {
            console.error('Error while storing otp and collectorata :', error);
            throw error;
        }
    };

    async verifyOtp(email: string, otp: string): Promise<{ accessToken: string; refreshToken: string; collector: ICollector }> {
        try {

            const prefix = "collector";
            const savedOtp = await this.redisRepository.getOtp(email, prefix);
            console.log("Enterd otp:", otp);
            console.log("saved Otp :", savedOtp);

            if (savedOtp !== otp) {
                console.log("invalid otp")
                const error: any = new Error("Invalid OTP");
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const collectorData = await this.redisRepository.getUserData(email, prefix) as ICollector;

            console.log("OTP verified successfully for email:", collectorData);

            if (!collectorData) {
                throw new Error(MESSAGES.UNKNOWN_ERROR);
            }

            await this.redisRepository.deleteUserData(email, prefix);

            const hashedPassword = await bcrypt.hash(collectorData.password, 10);
            collectorData.password = hashedPassword;
            // collectorData.serviceArea = 'not-provided';

            const collector = await this.collectorRepository.createCollector(collectorData);
            console.log("collectorrrrrrrrrr:",collector)

            const accessToken = generateAccessToken(collector._id as string, 'collector');
            const refreshToken = generateRefreshToken(collector._id as string, 'collector');

            return { accessToken, refreshToken, collector };

        } catch (error: any) {
            console.error("Error while verifying OTP and creating user:", error);
            throw error;
        }
    }

    async resendOtp(email: string): Promise<void> {
        try {
            const prefix = "collector";
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            await sendOtp(email, otp);
            await this.redisRepository.saveOtp(email, otp, 35, prefix);
        } catch (error) {
            console.error('Error while resending otp:', error);
            throw error;
        }
    }

    async validateRefreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; }> {
        try {
            
            const decoded = verifyToken(token);
            
            const user = await this.collectorRepository.getCollectorById(decoded.userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            console.log("decoded in service:", decoded);

            const accessToken = generateAccessToken(user._id as string, 'collector');
            const refreshToken = generateRefreshToken(user._id as string, 'collector');

            return { accessToken, refreshToken };

        } catch (error) {
            console.error('Error while storing refreshToken :', error);
            throw error;
        }
    }

    async getCollector(id: string): Promise<ICollector> {
        try {
            const collector = await this.collectorRepository.getCollectorById(id);

            if (!collector) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            return collector;

        } catch (error: any) {
            console.log("Error while fetching collectorData :", error.message);
            throw error;
        }
    }

    async updateCollector(id: string, collectorData: Partial<ICollector>): Promise<ICollector | null> {
        try {
            const user = await this.collectorRepository.updateCollectorById(id, collectorData);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            return user;
        } catch (error: any) {
            console.log("Error while fetching user data :", error.message);
            throw error;
        }
    }
};