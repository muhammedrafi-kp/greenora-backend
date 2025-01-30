import express from "express";
import { configDotenv } from "dotenv";
import morgan from "morgan";
import connectDB from './config/dbConfig';

import categoryRoutes from "../src/routes/categoryRoutes";
import requestRoutes from "../src/routes/requestRoutes";

configDotenv();

const app = express();

connectDB();

app.use(morgan('dev'));
app.use(express.json());

app.use('/category', categoryRoutes);
app.use('/request', requestRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});