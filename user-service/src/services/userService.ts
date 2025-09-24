import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { IUserService } from "../interfaces/user/IUserService";
import OTP from "otp-generator";
import { sendOtp, sendResetPasswordLink } from "../utils/mail";
import { generateAccessToken, generateRefreshToken, generateResetPasswordToken, verifyToken, verifyGoogleToken, decodeToken } from "../utils/token";
import { MESSAGES } from "../constants/messages";
import { HTTP_STATUS } from "../constants/httpStatus";
import bcrypt from "bcrypt";
import { configDotenv } from "dotenv";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from "../config/s3Config";
import { getSignedProfileImageUrl } from "../utils/s3";
import { TokenPayload } from "google-auth-library";
import { ICollectorRepository } from "../interfaces/collector/ICollectorRepository";
import { IAdminRepository } from "../interfaces/admin/IAdminRepository";
import RabbitMQ from "../utils/rabbitmq";

import { SignupDto } from "../dtos/request/auth.dto";
import { UpdateUserDto } from "../dtos/request/user.dto"
import { AuthDTo } from "../dtos/response/auth.dto";
import { UserDto } from "../dtos/response/user.dto";
import { CollectorDto } from "../dtos/response/collector.dto";
import { AdminDto } from "../dtos/response/admin.dto";

configDotenv();

export class UserService implements IUserService {

    constructor(
        private _userRepository: IUserRepository,
        private _collectorRepository: ICollectorRepository,
        private _adminRepository: IAdminRepository,
        private _redisRepository: IRedisRepository
    ) {
    }

    async login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }> {
        try {
            const user = await this._userRepository.findOne({ email });

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }


            if (user.isBlocked) {
                const error: any = new Error(MESSAGES.USER_BLOCKED);
                error.status = HTTP_STATUS.FORBIDDEN;
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

            return { accessToken, refreshToken, user: AuthDTo.from(user) };

        } catch (error) {
            console.error('Error while creating user:', error);
            throw error;
        }
    }

    async signUp(userData: SignupDto): Promise<void> {
        try {
            const { email } = userData;

            const existingUser = await this._userRepository.findOne({ email });

            if (existingUser) {
                const error: any = new Error("Email already exists!");
                error.status = HTTP_STATUS.CONFLICT;
                throw error;
            }

            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            console.log("otp :", otp);

            await sendOtp(email, otp);

            await this._redisRepository.set(`user-otp:${email}`, otp, 35);
            await this._redisRepository.set(`user:${email}`, userData, 86400);
        } catch (error) {
            console.error('Error while storing otp and userData :', error);
            throw error;
        }
    }

    async verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }> {
        try {

            const savedOtp = await this._redisRepository.get(`user-otp:${email}`);

            console.log("Enterd otp:", otp);
            console.log("saved Otp :", savedOtp);

            if (savedOtp !== otp) {
                console.log("invalid otp")
                const error: any = new Error(MESSAGES.INVALID_OTP);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const userData = await this._redisRepository.get(`user:${email}`) as SignupDto;

            console.log("OTP verified successfully for email:", userData);

            if (!userData) {
                const error: any = new Error(MESSAGES.SIGNUP_SESSION_EXPIRED);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }

            await this._redisRepository.delete(`user:${email}`);

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const user = await this._userRepository.create(userData);

            RabbitMQ.publish("user-created", { userId: user._id });
            console.log("User created and sent to queue:", user._id);

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken, user: AuthDTo.from(user) };

        } catch (error: any) {
            console.error("Error while verifying OTP and creating user:", error);
            throw error;
        }
    }

    async resendOtp(email: string): Promise<void> {
        try {
            const otp = OTP.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            console.log("otp :", otp);
            await sendOtp(email, otp);
            await this._redisRepository.set(`user-otp:${email}`, otp, 35);
        } catch (error) {
            console.error('Error while resending otp:', error);
            throw error;
        }
    }

    async validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }> {
        try {
            const isBlacklisted = await this._redisRepository.get(`bl-refresh:${token}`);

            if (isBlacklisted) {
                console.warn(`Blacklisted refresh token used: ${token}`);
                const error: any = new Error(MESSAGES.TOKEN_BLACKLISTED);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET as string);

            const user = await this._userRepository.findById(decoded.userId);

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

    async logout(refreshToken: string): Promise<void> {
        try {
            const decoded = decodeToken(refreshToken);

            if (!decoded || typeof decoded.exp !== 'number') {
                throw new Error("Invalid or malformed refresh token");
            }

            const expirySeconds = decoded.exp - Math.floor(Date.now() / 1000);

            await this._redisRepository.set(`bl-refresh:${refreshToken}`, "true", expirySeconds);

        } catch (error: any) {
            console.error("Error during logout:", error.message);
            throw error;
        }
    }

    async handleGoogleAuth(credential: string): Promise<{ accessToken: string; refreshToken: string; user: AuthDTo }> {
        try {

            const payload = await verifyGoogleToken(credential) as TokenPayload;

            if (!payload || !payload.email) {
                const error: any = new Error(MESSAGES.INVALID_INPUT);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            console.log("payload :", payload);

            let user = await this._userRepository.findOne({ email: payload.email });

            console.log("user :", user);

            if (!user) {
                user = await this._userRepository.create({
                    name: payload.name,
                    email: payload.email,
                    phone: 'N/A',
                    password: '',
                    // profileUrl: payload.picture,
                    authProvider: "google",
                });

                RabbitMQ.publish("user-created", { userId: user._id });
            }

            if (user.isBlocked) {
                const error: any = new Error(MESSAGES.USER_BLOCKED);
                error.status = HTTP_STATUS.FORBIDDEN;
                throw error;
            }

            const accessToken = generateAccessToken(user._id as string, 'user');
            const refreshToken = generateRefreshToken(user._id as string, 'user');

            return { accessToken, refreshToken, user: AuthDTo.from(user) };

        } catch (error) {
            console.error('Error while storing refreshToken :', error);
            throw error;
        }
    }

    async sendResetPasswordLink(email: string): Promise<void> {
        try {
            const user = await this._userRepository.findOne({ email });

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const resetToken = generateResetPasswordToken(user._id as string)

            const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

            await sendResetPasswordLink(email, resetURL);

            console.log(`Password reset link sent to ${email}`);

        } catch (error: any) {
            console.log("Error while sending reset link user data :", error.message);
            throw error;
        }
    }

    async resetPassword(token: string, password: string): Promise<void> {
        try {
            const decoded = verifyToken(token, process.env.JWT_RESET_PASSOWORD_SECRET as string);

            console.log("decode :", decoded)
            const user = await this._userRepository.findById(decoded.userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            console.log("password :", password);
            const hashedPassword = await bcrypt.hash(password, 10);
            await this._userRepository.updateById(user._id as string, { password: hashedPassword, authProvider: "local" });

        } catch (error: any) {
            console.log("Error while sending reset link user data :", error.message);
            throw error;
        }
    }

    async getUser(userId: string): Promise<UserDto> {
        try {
            const user = await this._userRepository.findById(userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (user.profileUrl) {
                const signedUrl = await getSignedProfileImageUrl(user.profileUrl);
                user.profileUrl = signedUrl;
            }

            return UserDto.from(user);

        } catch (error: any) {
            console.log("Error while fetching user data :", error.message);
            throw error;
        }
    }

    async updateUser(userId: string, userData: UpdateUserDto, profileImage?: Express.Multer.File): Promise<UserDto> {
        try {

            let profileKey: string | undefined;

            if (profileImage) {
                profileKey = `profile-images/user/${Date.now()}_${profileImage.originalname}`;

                const s3Params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME!,
                    Key: profileKey,
                    Body: profileImage.buffer,
                    ContentType: profileImage.mimetype,
                };

                const command = new PutObjectCommand(s3Params);
                await s3.send(command);
            }

            console.log("profileUrl :", profileKey);

            const updatedData: UpdateUserDto = {
                ...userData,
                ...(profileKey && { profileUrl: profileKey }),
            };

            const user = await this._userRepository.updateById(userId, updatedData);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            return UserDto.from(user);
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

            const profileKey = `profile-images/user/${Date.now()}_${file.originalname}`;

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: profileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(s3Params);
            await s3.send(command);

            const signedUrl = await getSignedProfileImageUrl(s3Params.Key);

            await this._userRepository.updateById(userId, { profileUrl: s3Params.Key });

            return signedUrl;
        } catch (error: any) {
            console.log("Error while fetching user data :", error.message);
            throw error;
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        try {
            const user = await this._userRepository.findById(userId);

            console.log("user in service:", user);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const isCorrectPassword = await bcrypt.compare(currentPassword, user.password);

            if (!isCorrectPassword) {
                const error: any = new Error(MESSAGES.INVALID_PASSWORD);
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;

            await this._userRepository.updateById(userId, user);
        } catch (error: any) {
            console.log("Error while fetching user data :", error.message);
            throw error;
        }
    }

    async getCollector(collectorId: string): Promise<CollectorDto> {
        try {
            const collector = await this._collectorRepository.findById(collectorId);

            if (!collector) {
                const error: any = new Error(MESSAGES.COLLECTOR_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (collector.profileUrl) {
                collector.profileUrl = await getSignedProfileImageUrl(collector.profileUrl);
            }

            return CollectorDto.from(collector);
        } catch (error: any) {
            console.log("Error while fetching collector data :", error.message);
            throw error;
        }
    }

    async getAdmin(): Promise<AdminDto | null> {
        try {
            const email = "admin@gmail.com";
            const admin = await this._adminRepository.findOne({ email });
            if (!admin) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
            return AdminDto.from(admin);
        } catch (error) {
            console.error('Error while fetching admin:', error);
            throw error;
        }
    }

    async getUsers(userIds: string[]): Promise<UserDto[]> {
        try {
            const users = await this._userRepository.find({ _id: { $in: userIds } });
            console.log("users :", users);
            return UserDto.fromList(users);
        } catch (error) {
            console.error('Error while fetching users:', error);
            throw error;
        }
    }

    async getUserBlockedStatus(userId: string): Promise<boolean> {
        try {
            const user = await this._userRepository.findById(userId);
            return user?.isBlocked || false;
        } catch (error) {
            console.error('Error while fetching user blocked status:', error);
            throw error;
        }
    }

}