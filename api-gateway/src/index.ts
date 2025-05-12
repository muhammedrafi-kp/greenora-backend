import express, { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { validateJwt } from "./middleware/validateJwt";
import { connectToRedis } from './config/redisConfig';
import { AuthConsumer } from './consumer/authConsumer';

configDotenv();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(morgan('dev'));

app.use(validateJwt as express.RequestHandler);

app.use("/user-service", createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
app.use("/request-service", createProxyMiddleware({ target: process.env.REQUEST_SERVICE_URL, changeOrigin: true }));
app.use("/location-service", createProxyMiddleware({ target: process.env.LOCATION_SERVICE_URL, changeOrigin: true }));
app.use("/payment-service", createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));
app.use("/subscription-service", createProxyMiddleware({ target: process.env.SUBSCRIPTION_SERVICE_URL, changeOrigin: true }));
app.use("/notification-service", createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL, changeOrigin: true }));
app.use("/chat-service", createProxyMiddleware({ target: process.env.CHAT_SERVICE_URL, changeOrigin: true }));

connectToRedis();
AuthConsumer.initialize();

app.listen(process.env.PORT, () => {
    console.log(`api-gateway is running on port ${process.env.PORT} ✅`);
});
