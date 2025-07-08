import express from "express";
import http from "http";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";
import morgan from "morgan";

import connectDB from "./config/dbConfig";
import { initializeSocket } from "./socket/socket";
import { connectToRedis } from "./config/redisConfig";
import chatRoutes from "./routes/chatRoutes";

configDotenv();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/chat/socket.io"
});

connectToRedis();
initializeSocket(io);
connectDB();

app.use(morgan("dev"));
app.use(express.json());
app.use("/", chatRoutes);

// ✅ Start socket-enabled HTTP server, not just app
server.listen(process.env.PORT, () => {
    console.log(`chat-service is running on port ${process.env.PORT} ✅`);
});
