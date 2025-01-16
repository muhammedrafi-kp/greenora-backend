import { IAdminService } from '../interfaces/admin/IAdminService';
import { IAdmin } from '../models/adminModel';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';


export class AdminService implements IAdminService {

    constructor(private adminRepository: IAdminRepository) { }


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

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string;admin: IAdmin }> {
        try {
            const admin = await this.adminRepository.findAdminByEmail(email);

            if (!admin) {
                throw new Error(MESSAGES.USER_NOT_FOUND);
            }

            const isCorrectPassword = await bcrypt.compare(password, admin?.password);

            if (!isCorrectPassword) {
                throw new Error(MESSAGES.INVALID_PASSWORD);
            }

            const accessToken = generateAccessToken(admin._id as string);
            const refreshToken = generateRefreshToken(admin._id as string);
            
            console.log("Login success full");

            return {accessToken,refreshToken,admin};

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }
}