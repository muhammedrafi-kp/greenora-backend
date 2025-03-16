import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { redisClient } from "../config/redisConfig";

class RedisRepository implements IRedisRepository {

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            await redisClient.set(key, JSON.stringify(value));
            if (ttl) {
                await redisClient.expire(key, ttl);
            }
        } catch (error) {
            throw new Error(`Failed to save data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            throw new Error(`Failed to get data from Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await redisClient.del(key);
        } catch (error) {
            throw new Error(`Failed to delete data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new RedisRepository();