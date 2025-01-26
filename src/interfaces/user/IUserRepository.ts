import { IUser } from "../../models/UserModel";

export interface IUserRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    findUserByEmail(email: string): Promise<IUser | null>;
    getUserById(userId: string): Promise<IUser | null>;
    getUsers(): Promise<IUser[]>;
    updateUserById(userId: string, userData: Partial<IUser>): Promise<IUser | null>;
    updateProfileUrl(userId: string, profileUrl: string): Promise<any>
    updateStatusById(userId: string, isBlocked: boolean): Promise<IUser | null>;
}