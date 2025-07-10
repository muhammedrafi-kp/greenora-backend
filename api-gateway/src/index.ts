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

connectToRedis();
AuthConsumer.initialize();

app.use(validateJwt as express.RequestHandler);


app.use("/user-service", createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
app.use("/collection-service", createProxyMiddleware({ target: process.env.COLLECTION_SERVICE_URL, changeOrigin: true }));
app.use("/payment-service", createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));
app.use("/collection-service", createProxyMiddleware({ target: process.env.COLLECTION_SERVICE_URL, changeOrigin: true }));
app.use("/payment-service", createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));
app.use("/location-service", createProxyMiddleware({ target: process.env.LOCATION_SERVICE_URL, changeOrigin: true }));
app.use("/chat-service", createProxyMiddleware({ target: process.env.CHAT_SERVICE_URL, changeOrigin: true, ws: true }));
app.use("/notification-service", createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL, changeOrigin: true, ws: true }));

// app.use('/socket/chat', createProxyMiddleware({
//     target: process.env.CHAT_SERVICE_URL,
//     ws: true,
//     pathRewrite: (path, req: Request) => req.originalUrl,
// }));


app.listen(process.env.PORT, () => {
    console.log(`api-gateway is running on port ${process.env.PORT} ✅`);
});
