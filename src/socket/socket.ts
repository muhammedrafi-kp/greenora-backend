import { Server, Socket } from "socket.io";

export const initializeSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log('🟢 New client connected:', socket.id);

        socket.on("join-room", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        socket.on("send-notification", ({ userId, message }) => {
            socket.to(userId).emit("receive-notification", { message });
        });

        socket.on('disconnect', () => {
            console.log('🔴 Client disconnected:', socket.id);
        });
    });
}