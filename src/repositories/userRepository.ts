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

    async getUserById(id: string): Promise<IUser | null> {
        try {
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Error while finding user:${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateUserById(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        try {
            return await this.updateById(id, userData);
        } catch (error) {
            throw new Error(`Error while updating user:${error instanceof Error ? error.message : String(error)}`);
        }
    }

}

export default new UserRepository();