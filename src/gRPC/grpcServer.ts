import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { CollectionService } from "../services/collectionService";
import collectionRepository from "../repositories/collectionRepository";
import categoryRepository from "../repositories/categoryRepository";
import redisRepository from "../repositories/redisRepository";
// import path from "path";

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

const collectionService = new CollectionService(collectionRepository, categoryRepository, redisRepository);

const server = new grpc.Server();
server.addService(collectionProto.collectionService.service, {
    ValidateCollectionData: async (call: any, callback: any) => {
        try {
            console.log("Received collection data:", call.request);
            const userId = call.request.userId;
            const collectionData = call.request.collectionData;
            const response = await collectionService.validateCollectionData(userId, collectionData);
            console.log("response in grpc server :",response);
            callback(null, response);
        } catch (error: any) {
            console.error("Error in ValidateCollectionData:", error.message);
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: error.message || "Validation failed.",
            });
        }
    },
    CreateCollection: async (call: any, callback: any) => {
        try {
            console.log("Received paynent data:", call.request);
            const response = await collectionService.createCollectionRequest(call.request);
            callback(null, response);
        } catch (error: any) {
            console.error("Error in ValidateCollectionData:", error.message);
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: error.message || "Validation failed.",
            });
        }
    }
});

const startGrpcServer = () => {
    server.bindAsync(`0.0.0.0:${process.env.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`gRPC Server is running on port ${process.env.GRPC_PORT} ✅`);
    });
};

export default startGrpcServer;