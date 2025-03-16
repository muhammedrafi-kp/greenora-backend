import express from "express";
import { configDotenv } from "dotenv";
import morgan from 'morgan';

import connectDB from "./config/dbConfig";

import collectionPaymentRoutes from "./routes/collectionPaymentRoutes";
import subscriptionPaymentRoutes from "./routes/subscriptionPaymentRoutes";


configDotenv();

const app = express();

connectDB();

app.use(morgan('dev'));
app.use(express.json());

app.use("/collection-payment",collectionPaymentRoutes);
app.use("/subscription-payment",subscriptionPaymentRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`payment-service is running on port ${process.env.PORT} ✅`);
});