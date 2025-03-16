import express from "express";
import { configDotenv } from "dotenv";
import morgan from "morgan";

import connectDB from "./config/dbConfig";

import startNotificationConsumer from "./consumers/notificationConsumer";


configDotenv();

const app = express();

connectDB();
startNotificationConsumer();

app.use(morgan('dev'));
app.use(express.json());

// app.use("/subscription",subscriptionRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`notification-service is running on port ${process.env.PORT} ✅`);
});