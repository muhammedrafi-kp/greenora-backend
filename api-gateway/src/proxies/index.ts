import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const setupProxies = (app: Express) => {
    app.use("/api/user-service", createProxyMiddleware({
        target: process.env.USER_SERVICE_URL,
        changeOrigin: true
    }));

    app.use("/api/collection-service", createProxyMiddleware({
        target: process.env.COLLECTION_SERVICE_URL,
        changeOrigin: true
    }));

    app.use("/api/payment-service", createProxyMiddleware({
        target: process.env.PAYMENT_SERVICE_URL,
        changeOrigin: true
    }));

    app.use("/api/location-service", createProxyMiddleware({
        target: process.env.LOCATION_SERVICE_URL,
        changeOrigin: true
    }));

    app.use("/api/chat-service", createProxyMiddleware({
        target: process.env.CHAT_SERVICE_URL,
        changeOrigin: true,
        ws: true
    }));

    app.use("/api/notification-service", createProxyMiddleware({
        target: process.env.NOTIFICATION_SERVICE_URL,
        changeOrigin: true,
        ws: true
    }));
};
