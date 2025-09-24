import express from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { validateToken } from "./middleware/validateToken";
import { connectToRedis } from './config/redisConfig';
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

app.use(validateToken as express.RequestHandler);

setupProxies(app);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(process.env.PORT, () => {
    console.log(`api-gateway is running on port ${process.env.PORT} ✅`);
});
