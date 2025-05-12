import Redis from 'ioredis';

const redis = new Redis({
    host: '127.0.0.1',
    port: 6379
});

const connectToRedis = async () => {
    redis.on('connect', () => {
        console.log("Redis client is connected ✅");
    });

    redis.on('error', (err) => {
        console.error('Redis client error ❌:', err);
    });

    redis.set("test", "test");
};


export { redis, connectToRedis };