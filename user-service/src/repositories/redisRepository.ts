import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import { redis } from '../config/redisConfig';

export class RedisRepository implements IRedisRepository {
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            await redis.set(key, JSON.stringify(value));
            if (ttl) {
                await redis.expire(key, ttl);
            }
        } catch (error) {
            throw new Error(`Failed to save data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            throw new Error(`Failed to get data from Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            throw new Error(`Failed to delete data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const value = await redis.exists(key);
            return value === 1;
        } catch (error) {
            throw new Error(`Failed to check existence of key "${key}" in Redis: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new RedisRepository();
