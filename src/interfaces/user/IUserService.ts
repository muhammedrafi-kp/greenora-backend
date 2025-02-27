import { IUser } from "../../models/User";

export interface IUserService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }>;
    signUp(userData: IUser): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }>;
    validateRefreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }>;
    resendOtp(email: string): Promise<void>;
    handleGoogleAuth(credential: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }>;
    getUser(userId: string): Promise<IUser>;
    updateUser(userId: string, userData: Partial<IUser>, profileImage?: Express.Multer.File): Promise<IUser | null>;
    uploadProfileImage(userId: string, file: Express.Multer.File | undefined): Promise<string | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}