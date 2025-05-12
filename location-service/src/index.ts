import express from "express";
import { configDotenv } from "dotenv";
import morgan from "morgan";

import connectDB from "./config/dbConfig";

import seriviceAreaRoutes from "./routes/seriviceAreaRoutes";
import addressRoutes from "./routes/addressRoutes";

configDotenv();

const app = express();

connectDB();

app.use(morgan('dev'));
app.use(express.json());

app.use('/service-area', seriviceAreaRoutes);
app.use('/address', addressRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT} ✅`);
});