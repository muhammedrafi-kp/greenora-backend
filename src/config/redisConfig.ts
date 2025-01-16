import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.on('connect', () => {
    console.log("Redis client is connected..!");
});

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

const connectToRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis connection established');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1);
    }
}

const disconnectFromRedis = async () => {
    await redisClient.quit();
    console.log('Redis client disconnected');
}


const logRedisData = async (req:any, res:any, next:any) => {
    try {
        // console.log("Logging Redis data...");
        const keys = await redisClient.keys('*');
        if (keys.length === 0) {
            console.log('No keys found in Redis');
        } else {
            console.log('Keys in Redis:');
            for (const key of keys) {
                const value = await redisClient.get(key);
                console.log(`Key: ${key}, Value: ${value}`);
            }
        }
    } catch (err) {
        console.error('Error logging Redis data:', err);
    }
    next(); // Proceed to the next middleware or route handler
};
  

export { redisClient, connectToRedis, disconnectFromRedis,logRedisData };
