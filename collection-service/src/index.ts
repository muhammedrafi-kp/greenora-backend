import express from "express";
import { configDotenv } from "dotenv";
import morgan from "morgan";

import connectDB from './config/dbConfig';
import startGrpcServer from "./gRPC/grpcServer";
import { connectToRedis } from './config/redisConfig';
import CollectionConsumer from "./consumers/collectionConsumer";

import categoryRoutes from "./routes/categoryRoutes";
import collectionRoutes from "./routes/collectionRoutes";

configDotenv();

const app = express();

connectDB();
startGrpcServer();
connectToRedis();
CollectionConsumer.initialize();

app.use(morgan('dev'));
app.use(express.json()); 

app.use('/category', categoryRoutes);
app.use('/collections', collectionRoutes);

app.listen(process.env.PORT, () => {
    console.log(`collection-Service is running on port ${process.env.PORT} ✅`);
});