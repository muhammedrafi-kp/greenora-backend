import express from "express";
import { configDotenv } from "dotenv";
import morgan from "morgan";

import connectDB from './config/dbConfig';
import startGrpcServer from "./gRPC/grpcServer";
import { connectToRedis, logRedisData } from './config/redisConfig'


import categoryRoutes from "../src/routes/categoryRoutes";
import collectionRoutes from "./routes/collectionRoutes";

configDotenv();

const app = express();

connectDB();
startGrpcServer();
connectToRedis()

app.use(morgan('dev'));
app.use(express.json());

app.use('/category', categoryRoutes);
app.use('/collection', collectionRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});