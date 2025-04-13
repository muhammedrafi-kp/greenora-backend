import express from "express";
import { configDotenv } from "dotenv";
import morgan from 'morgan';

import connectDB from "./config/dbConfig";
import PaymentConsumer from "./consumers/PaymentConsumer";

import collectionPaymentRoutes from "./routes/collectionPaymentRoutes";
import walletRoutes from "./routes/walletRoutes";


configDotenv();

const app = express();

connectDB();
PaymentConsumer.initialize();

app.use(morgan('dev'));
app.use(express.json());

app.use("/collection-payment",collectionPaymentRoutes);
app.use("/wallet",walletRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`payment-service is running on port ${process.env.PORT} ✅`);
});