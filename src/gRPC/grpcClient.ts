import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { configDotenv } from "dotenv";

configDotenv();

const PROTO_PATH = './src/gRPC/collectors.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const collectorsProto: any = grpc.loadPackageDefinition(packageDefinition).collectors;

const collectorsClient = new collectorsProto.collectorService(
    'localhost:50052',
    grpc.credentials.createInsecure()
);

export default collectorsClient;
