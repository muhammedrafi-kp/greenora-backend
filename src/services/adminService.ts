import { IAdminService } from '../interfaces/admin/IAdminService';
import { IAdmin } from '../models/Admin';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import { IUserRepository } from '../interfaces/user/IUserRepository';
import { ICollectorRepository } from '../interfaces/collector/ICollectorRepository';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/token';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { IUser } from '../models/User';
import { ICollector } from '../models/Collector';


export class AdminService implements IAdminService {

    constructor(
        private adminRepository: IAdminRepository,
        private userRepository: IUserRepository,
        private collectorRepository: ICollectorRepository
    ) { };


    async createAdmin(email: string, password: string): Promise<IAdmin> {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const admin = await this.adminRepository.createAdmin({ email, password: hashedPassword });
            return admin;

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; admin: IAdmin }> {
        try {
            const admin = await this.adminRepository.findAdminByEmail(email);

            if (!admin) {
                throw new Error(MESSAGES.USER_NOT_FOUND);
            }

            const isCorrectPassword = await bcrypt.compare(password, admin?.password);

            if (!isCorrectPassword) {
                throw new Error(MESSAGES.INVALID_PASSWORD);
            }

            const accessToken = generateAccessToken(admin._id as string, 'admin');
            const refreshToken = generateRefreshToken(admin._id as string, 'admin');

            console.log("Login success full");

            return { accessToken, refreshToken, admin };

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async validateRefreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; }> {
        try {

            const decoded = verifyToken(token);

            const user = await this.adminRepository.getAdminById(decoded.userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            console.log("decoded in service:", decoded);

            const accessToken = generateAccessToken(user._id as string, 'admin');
            const refreshToken = generateRefreshToken(user._id as string, 'admin');

            return { accessToken, refreshToken };

        } catch (error) {
            console.error('Error while storing refreshToken :', error);
            throw error;
        }
    }

    // async getUsers(search: string, filter: string, sort: string, page: number, limit: number): Promise<IUser[]> {
    //     try {

    //     } catch (error) {

    //     }
    // }

    async getUsers(): Promise<IUser[]> {
        try {
            return this.userRepository.getUsers();
        } catch (error) {
            console.error('Error while fetching users:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getCollectors(): Promise<ICollector[]> {
        try {
            return this.collectorRepository.getCollectors();
        } catch (error) {
            console.error('Error while fetching users:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async updateUserStatus(id: string): Promise<string> {
        try {
            const user = await this.userRepository.getUserById(id);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const updatedUser = await this.userRepository.updateStatusById(id, !user.isBlocked as boolean);

            return updatedUser?.isBlocked
                ? 'Blocked successfully.'
                : 'Unblocked successfully.';
        } catch (error: any) {
            console.log("Error while updating user status :", error.message);
            throw error;
        }
    }

    async updateCollectorStatus(id: string): Promise<string> {
        try {
            const user = await this.collectorRepository.getCollectorById(id);

            if (!user) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }

            const updatedUser = await this.collectorRepository.updateStatusById(id, !user.isBlocked as boolean);

            return updatedUser?.isBlocked
                ? 'Blocked successfully.'
                : 'Unblocked successfully.';
        } catch (error: any) {
            console.log("Error while updating user status :", error.message);
            throw error;
        }
    }
}