import express, { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { IncomingMessage } from 'http';
import { validateJwt } from "./middleware/validateJwt";

configDotenv();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));


app.use(morgan('dev'));

const port = process.env.PORT || 3000;


app.use(validateJwt as express.RequestHandler);

app.use("/user-service", createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use("/request-service", createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use("/location-service", createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use("/payment-service", createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
app.use("/subscription-service", createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));

app.listen(port, () => {
    console.log(`api-gateway is running on port ${port}`);
});
