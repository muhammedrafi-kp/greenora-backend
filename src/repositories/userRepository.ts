import User, { IUser } from "../models/userModel"
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { BaseRepository } from "./baseRepository";


class UserRepository extends BaseRepository<IUser> implements IUserRepository {

    constructor() {
        super(User);
    }

    async createUser(userData: Partial<IUser>): Promise<IUser> {
        try {
            console.log("google userdata in repo :", userData);
            return await this.create(userData);
        } catch (error: unknown) {
            throw new Error(`Error while creating user : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        try {
            return await this.findOne({ email });
        } catch (error) {
            throw new Error(`Error while finding user : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getUserById(userId: string): Promise<IUser | null> {
        try {
            return await this.findById(userId);
        } catch (error) {
            throw new Error(`Error while finding user:${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateUserById(userId: string, userData: Partial<IUser>): Promise<IUser | null> {
        try {
            return await this.updateById(userId, userData);
        } catch (error) {
            throw new Error(`Error while updating user:${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateProfileUrl(userId: string, profileUrl: string): Promise<any> {
        try {
            return await this.updateById(userId, { profileUrl }as Partial<IUser>);
        } catch (error) {
            throw new Error(`Error while updating user profile url:${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getUsers(): Promise<IUser[]> {
        try {
            const projection = {
                name: 1,
                email: 1,
                phone: 1,
                profileUrl: 1,
                isBlocked: 1
            };
            return await this.findAll(projection);
        } catch (error: unknown) {
            throw new Error(`Error while creating admin : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateStatusById(userId: string, isBlocked: boolean): Promise<IUser | null> {
        try {
            return await this.updateById(userId, { isBlocked } as Partial<IUser>);
        } catch (error) {
            throw new Error(`Error while updating user status : ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new UserRepository();