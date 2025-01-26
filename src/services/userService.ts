import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { IUserService } from "../interfaces/user/IUserService";
import { IUser } from "../models/User";
import OTP from "otp-generator";
import { sendOtp } from "../utils/mail";
import { generateAccessToken, generateRefreshToken,verifyToken } from "../utils/token";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";
import bcrypt from "bcrypt";
// import jwt, { JwtPayload } from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from "../config/s3Config";
import { error } from "console";

configDotenv();

export class UserService implements IUserService {

    constructor(
        private userRepository: IUserRepository,
        private redisRepository: IRedisRepository
    ) { };

    async login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }> {
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

            // await this.redisRepository.saveRefreshToken(user._id as string, refreshToken, 10, 'refresh_token');

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

            // const prefix = "user";
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            await sendOtp(email, otp);
            await this.redisRepository.saveOtp(email, otp, 35, 'user');
            await this.redisRepository.saveUserData(email, userData, 86400, 'user');
        } catch (error) {
            console.error('Error while storing otp and userData :', error);
            throw error;
        }
    }

    async verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }> {
        try {

            // const prefix = "user";
            const savedOtp = await this.redisRepository.getOtp(email, 'user');
            console.log("Enterd otp:", otp);
            console.log("saved Otp :", savedOtp);

            if (savedOtp !== otp) {
                console.log("invalid otp")
                const error: any = new Error(MESSAGES.INVALID_OTP);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const userData = await this.redisRepository.getUserData(email, 'user') as IUser;


            console.log("OTP verified successfully for email:", userData);

            if (!userData) {
                const error: any = new Error(MESSAGES.SIGNUP_SESSION_EXPIRED);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }

            await this.redisRepository.deleteUserData(email, 'user');


            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const user = await this.userRepository.createUser(userData);

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            // await this.redisRepository.saveRefreshToken(user._id as string, refreshToken, 10, 'refresh_token');

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

    async validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }> {
        try {
            
            const decoded = verifyToken(token);
            
            const user = await this.userRepository.getUserById(decoded.userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            console.log("decoded in service:", decoded);

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken };

        } catch (error) {
            console.error('Error while storing refreshToken :', error);
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

    async getUser(userId: string): Promise<IUser> {
        try {
            const user = await this.userRepository.getUserById(userId);

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

    async updateUser(userId: string, userData: Partial<IUser>, profileImage?: Express.Multer.File): Promise<IUser | null> {
        try {

            let profileUrl: string | undefined;

            if (profileImage) {
                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME!,
                    Key: `profile-images/user/${Date.now()}_${profileImage.originalname}`,
                    Body: profileImage.buffer,
                    ContentType: profileImage.mimetype,
                };

                const command = new PutObjectCommand(s3Params);
                const s3Response = await s3.send(command);

                profileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
            }

            console.log("profileUrl ", profileUrl);

            const updatedData: Partial<IUser> = {
                ...userData,
                ...(profileUrl && { profileUrl }),
            };

            const user = await this.userRepository.updateUserById(userId, updatedData);

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

    async uploadProfileImage(userId: string, file: Express.Multer.File | undefined): Promise<string | null> {
        try {
            if (!file) {
                throw new Error("Profile image file is missing.");
            }

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: `profile-images/user/${Date.now()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(s3Params);
            await s3.send(command);

            const profileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

            await this.userRepository.updateProfileUrl(userId, profileUrl);

            return profileUrl;
        } catch (error: any) {
            console.log("Error while fetching user data :", error.message);
            throw error;
        }
    }

}