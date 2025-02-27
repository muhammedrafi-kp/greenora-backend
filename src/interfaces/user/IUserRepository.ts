import { IUser } from "../../models/User";
import { IBaseRepository } from "../baseRepository/IBaseRepository";

export interface IUserRepository extends IBaseRepository<IUser> {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserById(userId: string): Promise<IUser | null>;
    getUsers(): Promise<IUser[]>;
    updateUserById(userId: string, userData: Partial<IUser>): Promise<IUser | null>;
    updateProfileUrl(userId: string, profileUrl: string): Promise<any>
    updateStatusById(userId: string, isBlocked: boolean): Promise<IUser | null>;
}