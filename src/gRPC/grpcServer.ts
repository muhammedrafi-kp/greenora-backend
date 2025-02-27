import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
// import { CollectionService } from "../services/collectionService";
// import collectionRepository from "../repositories/collectionRepository";
// import categoryRepository from "../repositories/categoryRepository";
import { CollectorService } from "../services/collectorService";
import collectorRepository from "../repositories/collectorRepository";
import redisRepository from "../repositories/redisRepository";
// import path from "path";

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

const collectorService = new CollectorService(collectorRepository, redisRepository);

const server = new grpc.Server();
server.addService(collectorsProto.collectorService.service, {
    GetAvailableCollectors: async (call: any, callback: any) => {
        try {
            console.log("data in grpc server: ", call.request);
            const serviceAreaId = call.request.serviceAreaId;
            const response = await collectorService.getAvailableCollectors(serviceAreaId);
            console.log("response :", response);
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