import {SignupDto} from "../../dtos/request/auth.dto"
import { IUser } from "../../models/User";
import { AuthDTo } from "../../dtos/response/auth.dto";
import {UpdateUserDto} from "../../dtos/request/user.dto"
import { UserDto } from "../../dtos/response/user.dto";
import { CollectorDto } from "../../dtos/response/collector.dto";
import { AdminDto } from "../../dtos/response/admin.dto";


export interface IUserService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    signUp(userData: SignupDto): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    resendOtp(email: string): Promise<void>;
    handleGoogleAuth(credential: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    sendResetPasswordLink(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    logout(refreshToken: string): Promise<void>;

    getUser(userId: string): Promise<UserDto>;
    updateUser(userId: string, userData: UpdateUserDto, profileImage?: Express.Multer.File): Promise<UserDto >;
    uploadProfileImage(userId: string, file: Express.Multer.File | undefined): Promise<string | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getCollector(collectorId: string): Promise<CollectorDto>;
    getAdmin(): Promise<AdminDto | null>;
    getUsers(userIds: string[]): Promise<UserDto[]>;
    getUserBlockedStatus(userId: string): Promise<boolean>;
}