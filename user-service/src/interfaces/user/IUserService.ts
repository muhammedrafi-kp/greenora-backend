import { IAdmin } from "../../models/Admin";
import { ICollector } from "../../models/Collector";
import { IUser } from "../../models/User";
import { AuthDTo } from "../../dtos/response/auth.dto";
import { UserDto } from "../../dtos/response/user.dto";


export interface IUserService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    signUp(userData: IUser): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    resendOtp(email: string): Promise<void>;
    handleGoogleAuth(credential: string): Promise<{ accessToken: string, refreshToken: string, user: AuthDTo }>;
    sendResetPasswordLink(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    logout(refreshToken: string): Promise<void>;

    getUser(userId: string): Promise<UserDto>;
    updateUser(userId: string, userData: Partial<IUser>, profileImage?: Express.Multer.File): Promise<UserDto >;
    uploadProfileImage(userId: string, file: Express.Multer.File | undefined): Promise<string | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getCollector(collectorId: string): Promise<ICollector>;
    getAdmin(): Promise<IAdmin | null>;
    getUsers(userIds: string[]): Promise<IUser[]>;
    getUserBlockedStatus(userId: string): Promise<boolean>;
}