import express, { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import { connectToRedis, logRedisData } from './config/redisConfig'
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import passportConfig from "./config/passportConfig"

import connectDB from './config/dbConfig';
import userRouter from './routes/userRoutes';
import collectorRouter from './routes/collectorRoutes';
import adminRoutes from './routes/adminRoutes';

import OTP from 'otp-generator';
const otp = OTP.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
console.log("OTP:", otp);

configDotenv();

const app = express();

connectDB();
connectToRedis();

app.use(morgan('dev'));
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

app.use('/user', userRouter);
app.use('/collector', collectorRouter);
app.use('/admin', adminRoutes);


const { PORT } = process.env || 4000;


app.listen(PORT, () => {
    console.log(`user-service is running on port ${PORT}`);
});


