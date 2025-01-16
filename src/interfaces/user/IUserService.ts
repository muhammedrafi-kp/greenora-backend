import { IUser } from "../../models/userModel";

export interface IUserService {
    login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }>;
    signUp(userData: IUser): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<{ accessToken: string, refreshToken: string, user: IUser }>;
    resendOtp(email: string): Promise<void>;
    handleGoogleAuth(userData: { name: string; email: string, profileUrl: string }): Promise<{ accessToken: string, refreshToken: string }>;
    getUser(id: string): Promise<IUser>;
    updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null>;
}