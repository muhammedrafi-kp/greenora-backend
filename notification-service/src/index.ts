import express from "express";
import http from "http";
import { Server } from "socket.io"
import { configDotenv } from "dotenv";
import morgan from "morgan";


import connectDB from "./config/dbConfig";
import { initializeSocket } from "./socket/socket";
import NotificationConsumer from "./consumers/notificationConsumer";
import notificationRoutes from "./routes/notificationRoutes";

configDotenv();

const app = express();

const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    },
    path: "/notification/socket.io",
});

connectDB();
NotificationConsumer.initialize();
initializeSocket(io);

app.use(morgan('dev'));
app.use(express.json());

app.use("/notification", notificationRoutes);

server.listen(process.env.PORT, () => {
    console.log(`notification-service is running on port ${process.env.PORT} ✅`);
});