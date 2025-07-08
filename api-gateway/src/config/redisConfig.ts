import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

const connectToRedis = async () => {
    redis.on('connect', () => {
        console.log("Redis client is connected ✅");
    });

    redis.on('error', (err) => {
        console.error('Redis client error ❌:', err);
    });
};


export { redis, connectToRedis };