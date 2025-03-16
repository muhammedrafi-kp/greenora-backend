// import { redisClient } from '../config/redisConfig';
// import { IRedisBaseRepository } from '../interfaces/baseRepository/IRedisBaseRepository';

// export class RedisRepository<T>implements IRedisRepository<T> {
//     async set(key: string, value: T, ttl?: number): Promise<void> {
//         try {
//             await redisClient.set(key, JSON.stringify(value));
//             if (ttl) {
//                 await redisClient.expire(key, ttl);
//             }
//         } catch (error) {
//             throw new Error(`Failed to save data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
//         }
//     }

//     async get(key: string): Promise<T | null> {
//         try {
//             const value = await redisClient.get(key);
//             return value ? JSON.parse(value) : null;
//         } catch (error) {
//             throw new Error(`Failed to get data from Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
//         }
//     }

//     async delete(key: string): Promise<void> {
//         try {
//             await redisClient.del(key);
//         } catch (error) {
//             throw new Error(`Failed to delete data in Redis for key "${key}": ${error instanceof Error ? error.message : String(error)}`);
//         }
//     }

//     async exists(key: string): Promise<boolean> {
//         try {
//             const value = await redisClient.exists(key);
//             return value === 1;
//         } catch (error) {
//             throw new Error(`Failed to check existence of key "${key}" in Redis: ${error instanceof Error ? error.message : String(error)}`);
//         }
//     }
// }
