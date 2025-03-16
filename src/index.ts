import express, { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import winston from 'winston';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import passportConfig from "./config/passportConfig"
import connectDB from './config/dbConfig';
import startGrpcServer from './gRPC/grpcServer';
import { connectToRedis, logRedisData } from './config/redisConfig'

import userRoutes from './routes/userRoutes';
import collectorRoutes from './routes/collectorRoutes';
import adminRoutes from './routes/adminRoutes';

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: 'logs/app.log' }),
    ],
});

const stream = {
    write: (message: string) => logger.info(message.trim()), 
};


configDotenv();

const app = express();

app.use(morgan('combined', { stream }));

connectDB();
startGrpcServer();
connectToRedis();

// app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(logRedisData);

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passportConfig.initialize());
app.use(passportConfig.session());

app.use('/user', userRoutes);
app.use('/collector', collectorRoutes);
app.use('/admin', adminRoutes);


app.listen(process.env.PORT, () => {
    console.log(`user-service is running on port ${process.env.PORT} ✅`);
});


