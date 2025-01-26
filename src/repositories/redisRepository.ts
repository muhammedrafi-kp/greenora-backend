import { RedisBaseRepository } from "./redisBaseRepository";
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { IUser } from "../models/User";
import { ICollector } from "../models/Collector";

class RedisRepository extends RedisBaseRepository<any> implements IRedisRepository {
    async saveOtp(email: string, otp: string, ttl: number, prefix: string): Promise<void> {
        try {
            console.log(email, otp, ttl);
            const key = `${prefix}-otp:${email}`;
            await this.save(key, otp, ttl);
        } catch (error) {
            throw new Error(`Error while saving otp : ${error instanceof Error ? error.message : String(error)}`);
        }

    }

    async getOtp(email: string, prefix: string): Promise<string | null> {
        try {
            const key = `${prefix}-otp:${email}`;
            return this.get(key);
        } catch (error) {
            throw new Error(`Error while getting otp : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // async deleteOtp(email: string): Promise<void> {
    //     try {
    //         const key = `otp:${email}`;
    //         await this.delete(key);
    //     } catch (error) {
    //         throw new Error(`Error while deleting otp : ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }

    async saveUserData(email: string, userdata: IUser | ICollector,ttl: number, prefix: string): Promise<void> {
        try {
            const key = `${prefix}:${email}`;
            await this.save(key, userdata);
        } catch (error) {
            throw new Error(`Error while saving userData : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getUserData(email: string, prefix: string): Promise<IUser | ICollector> {
        try {
            const key = `${prefix}:${email}`;
            return await this.get(key);
        } catch (error) {
            throw new Error(`Error while getting userData : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deleteUserData(email: string, prefix: string): Promise<void> {
        try {
            const key = `${prefix}:${email}`;
            await this.delete(key);
        } catch (error) {
            throw new Error(`Error while deleting userData : ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // async saveRefreshToken(id: string, refreshToken: string, ttl: number, prefix: string): Promise<void> {
    //     try {
    //         const key = `${prefix}:${id}`;
    //         await this.save(key, refreshToken, ttl);
    //     } catch (error) {
    //         throw new Error(`Error while storing refreshToken : ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }

    // async getRefreshToken(id: string, prefix: string): Promise<string> {
    //     try {
    //         const key = `${prefix}:${id}`;
    //         return await this.get(key);
    //     } catch (error) {
    //         throw new Error(`Error while getting refreshToken : ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }

}

export default new RedisRepository();