import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { configDotenv } from "dotenv";

configDotenv();

const USER_PROTO_PATH = './src/gRPC/protos/user.proto';
const COLLECTOR_PROTO_PATH = './src/gRPC/protos/collector.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const userPackageDef = protoLoader.loadSync(USER_PROTO_PATH, options);
const collectorPackageDef = protoLoader.loadSync(COLLECTOR_PROTO_PATH, options);

const userProto: any = grpc.loadPackageDefinition(userPackageDef).user;
const collectorProto: any = grpc.loadPackageDefinition(collectorPackageDef).collector;

const userClient = new userProto.userService(
    process.env.GRPC_USER_SERVICE_URL,
    grpc.credentials.createInsecure()
);

const collectorClient = new collectorProto.collectorService(
    process.env.GRPC_USER_SERVICE_URL,
    grpc.credentials.createInsecure()
);

export { userClient, collectorClient };
