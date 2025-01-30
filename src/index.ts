import express from "express";
import {configDotenv} from "dotenv";
import morgan from  "morgan";

import connectDB from "./config/dbConfig";

import locationRoutes from "../src/routes/locationRoutes";

configDotenv();

const app = express();

connectDB();



app.use(morgan('dev'));
app.use(express.json());

app.use('/',locationRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});