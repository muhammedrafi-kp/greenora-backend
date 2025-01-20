import { IUser } from "../../models/userModel";

export interface IUserRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    findUserByEmail(email: string): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    getUsers(): Promise<IUser[]>;
    updateUserById(id: string, userData: Partial<IUser>): Promise<IUser | null>;
    updateStatusById(id: string, isBlocked: boolean): Promise<IUser | null>;
}