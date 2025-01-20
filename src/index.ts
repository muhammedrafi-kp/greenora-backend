import express, { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { IncomingMessage } from 'http';
import { validateToken } from "./middleware/validateToken";

configDotenv();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'refresh-token'],
    credentials: true
}));


app.use(morgan('dev'));

const port = process.env.PORT || 3000;


app.use(validateToken as express.RequestHandler);

app.use('/user-service', createProxyMiddleware({ target: 'http://localhost:4000', changeOrigin: true }));

app.listen(port, () => {
    console.log(`api-gateway is running on port ${port}`);
});
