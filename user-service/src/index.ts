import express from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import winston from 'winston';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import connectDB from './config/dbConfig';
import startGrpcServer from './gRPC/grpcServer';
import { connectToRedis } from './config/redisConfig';
import UserConsumer from './consumers/userConsumer';
import { requestLogger } from "./middlewares/requestLogger";

import userRoutes from './routes/userRoutes';
import collectorRoutes from './routes/collectorRoutes';
import adminRoutes from './routes/adminRoutes';

// const logger = winston.createLogger({
//     level: 'info',
//     transports: [
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.colorize(),
//                 winston.format.simple()
//             ),
//         }),
//         new winston.transports.File({ filename: 'logs/app.log' }),
//     ],
// });

// const stream = {
//     write: (message: string) => logger.info(message.trim()), 
// };


configDotenv();

const app = express();

// app.use(morgan('combined', { stream }));

connectDB();
startGrpcServer();
connectToRedis();
UserConsumer.initialize();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use('/users', userRoutes);
app.use('/collectors', collectorRoutes);
app.use('/admin', adminRoutes);


app.listen(process.env.PORT, () => {
    console.log(`user-service is running on port${process.env.PORT} ✅`);
    // logger.info(`user-service is running on port ${process.env.PORT} ✅`);
});


