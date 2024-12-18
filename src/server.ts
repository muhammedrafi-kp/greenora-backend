import express, {Request,Response} from 'express';
import {configDotenv} from 'dotenv';
import morgan from 'morgan';
import {createProxyMiddleware} from 'http-proxy-middleware'

configDotenv();

const app = express();

app.use(morgan('dev'));

const port = process.env.PORT|| 3000;


app.use('/user-service',createProxyMiddleware({target:'http://localhost:4000',changeOrigin:true}));

app.listen(port,()=>{
    console.log(`api-gateway is running on port ${port}`);
});