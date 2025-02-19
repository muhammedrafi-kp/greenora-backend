import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { configDotenv } from "dotenv";

configDotenv();

const PROTO_PATH = './src/gRPC/collection.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const collectionProto: any = grpc.loadPackageDefinition(packageDefinition).collection;

const collectionClient = new collectionProto.collectionService(
    `localhost:${process.env.GRPC_PORT}`,
    grpc.credentials.createInsecure()
);

export default collectionClient;
