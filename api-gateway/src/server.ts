import express from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware'
import { validateToken } from "./middleware/validateToken";
import { connectToRedis } from './config/redisConfig';
import { AuthConsumer } from './consumer/authConsumer';
import {setupProxies} from "./proxies";

configDotenv();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(morgan('dev'));

connectToRedis();
AuthConsumer.initialize();

app.use(validateToken as express.RequestHandler);

setupProxies(app);

// app.use("/api/user-service", createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
// app.use("/api/collection-service", createProxyMiddleware({ target: process.env.COLLECTION_SERVICE_URL, changeOrigin: true }));
// app.use("/api/payment-service", createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));
// app.use("/api/collection-service", createProxyMiddleware({ target: process.env.COLLECTION_SERVICE_URL, changeOrigin: true }));
// app.use("/api/payment-service", createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));
// app.use("/api/location-service", createProxyMiddleware({ target: process.env.LOCATION_SERVICE_URL, changeOrigin: true }));
// app.use("/api/chat-service", createProxyMiddleware({ target: process.env.CHAT_SERVICE_URL, changeOrigin: true, ws: true }));
// app.use("/api/notification-service", createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL, changeOrigin: true, ws: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(process.env.PORT, () => {
    console.log(`api-gateway is running on port ${process.env.PORT} ✅`);
});
