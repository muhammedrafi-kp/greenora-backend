
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { IUserService } from "../interfaces/user/IUserService";
import { IUser } from "../models/userModel";
import OTP from "otp-generator";
import { sendOtp } from "../utils/mail";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";
import bcrypt from "bcrypt"

export class UserService implements IUserService {

    constructor(
        private userRepository: IUserRepository,
        private redisRepository: IRedisRepository
    ) { };

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
        try {
            const user = await this.userRepository.findUserByEmail(email);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const isCorrectPassword = await bcrypt.compare(password, user.password);

            console.log("isCorrectPassword :", isCorrectPassword);

            if (!isCorrectPassword) {
                const error: any = new Error(MESSAGES.INVALID_PASSWORD);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken, user };

        } catch (error) {
            console.error('Error while creating user:', error);
            throw error;
        }
    }

    async signUp(userData: IUser): Promise<void> {
        try {
            const { email } = userData;

            const existingUser = await this.userRepository.findUserByEmail(email);

            if (existingUser) {
                const error: any = new Error("Email already exists!");
                error.status = HTTP_STATUS.CONFLICT;
                throw error;
            }

            const prefix = "user";
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            await sendOtp(email, otp);
            await this.redisRepository.saveOtp(email, otp, 35, prefix);
            await this.redisRepository.saveUserData(email, userData, prefix);
        } catch (error) {
            console.error('Error while storing otp and userData :', error);
            throw error;
        }
    }

    async verifyOtp(email: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
        try {

            const prefix = "user";
            const savedOtp = await this.redisRepository.getOtp(email, prefix);
            console.log("Enterd otp:", otp);
            console.log("saved Otp :", savedOtp);

            if (savedOtp !== otp) {
                console.log("invalid otp")
                const error: any = new Error("Invalid OTP");
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const userData = await this.redisRepository.getUserData(email, prefix) as IUser;


            console.log("OTP verified successfully for email:", userData);

            if (!userData) {
                throw new Error(MESSAGES.UNKNOWN_ERROR);
            }

            await this.redisRepository.deleteUserData(email, prefix);


            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const user = await this.userRepository.createUser(userData);

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken, user };

        } catch (error: any) {
            console.error("Error while verifying OTP and creating user:", error);
            throw error;
        }
    }

    async resendOtp(email: string): Promise<void> {
        try {
            const prefix = "user";
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            await sendOtp(email, otp);
            await this.redisRepository.saveOtp(email, otp, 35, prefix);
        } catch (error) {
            console.error('Error while resending otp:', error);
            throw error;
        }
    }

    async handleGoogleAuth(userData: { name: string; email: string, profileUrl: string }): Promise<{ accessToken: string, refreshToken: string }> {
        try {
            console.log("userData in service:", userData);
            let user = await this.userRepository.findUserByEmail(userData.email);

            if (!user) {
                user = await this.userRepository.createUser({
                    name: userData.name,
                    email: userData.email,
                    phone: 'not-provided',
                    password: '',
                    profileUrl: userData.profileUrl,
                    isBlocked: false,
                });
            }

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken };
        } catch (error: any) {
            console.error("Error in handleGoogleAuth:", error.message);
            throw error;
        }
    }

    async getUser(id: string): Promise<IUser> {
        try {
            const user = await this.userRepository.getUserById(id);

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

    async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        try {
            const user = await this.userRepository.updateUserById(id, userData);

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

}