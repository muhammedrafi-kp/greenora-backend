import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
// import { CollectionService } from "../services/collectionService";
// import collectionRepository from "../repositories/collectionRepository";
// import categoryRepository from "../repositories/categoryRepository";
import { CollectorService } from "../services/collectorService";
import collectorRepository from "../repositories/collectorRepository";
import adminRepository from "../repositories/adminRepository";
import redisRepository from "../repositories/redisRepository";

import { UserService } from "../services/userService";
import userRepository from "../repositories/userRepository";

// import path from "path";

const COLLECTOR_PROTO_PATH = './src/gRPC/protos/collector.proto';
const USER_PROTO_PATH = './src/gRPC/protos/user.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const collectorPackageDef = protoLoader.loadSync(COLLECTOR_PROTO_PATH, options);
const userPackageDef = protoLoader.loadSync(USER_PROTO_PATH, options);

const collectorProto: any = grpc.loadPackageDefinition(collectorPackageDef).collector;
const userProto: any = grpc.loadPackageDefinition(userPackageDef).user;

const collectorService = new CollectorService(collectorRepository, redisRepository);
const userService = new UserService(userRepository, collectorRepository, adminRepository, redisRepository);

const server = new grpc.Server();

server.addService(collectorProto.collectorService.service, {
    GetAvailableCollectors: async (call: any, callback: any) => {
        try {
            console.log("data in grpc server: ", call.request);
            const serviceAreaId = call.request.serviceAreaId;
            const response = await collectorService.getAvailableCollectors(serviceAreaId);

            const collectors = response.collectors.map((collector: any) => ({
                id: collector._id.toString(),
                ...collector, // Spread remaining fields
            }));

            console.log("response :", collectors);
            callback(null, response);
        } catch (error: any) {
            console.error("Error in GetAvailableCollectors:", error.message);
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: error.message,
            });
        }
    },

    UpdateCollector: async (call: any, callback: any) => {
        try {
            console.log("call.request in grpc server:", call.request);
            const { id, currentTasks, availabilityStatus } = call.request;

            const collector = await collectorService.updateCollector(id, { currentTasks, availabilityStatus });

            console.log("update response from grpc server: ", collector);

            callback(null, { success: true, message: "Collector updated successfully." });
        } catch (error: any) {
            console.error("Error in UpdateCollector:", error.message);
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: error.message,
            });
        }
    }
});


server.addService(userProto.userService.service, {
    GetUsers: async (call: any, callback: any) => {
        try {
            console.log("call.request in grpc server:", call.request);
            const userIds = call.request.userIds;
            const usersData = await userService.getUsers(userIds);

            const users = usersData.map((user: any) => ({
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                phone: user.phone
            }));

            callback(null, { success: true, users: users });
        } catch (error: any) {
            callback({ code: grpc.status.INTERNAL, message: error.message });
        }
    }
});

const startGrpcServer = () => {
    server.bindAsync(`0.0.0.0:${process.env.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`gRPC Server is running on port ${process.env.GRPC_PORT} ✅`);
    });
};

export default startGrpcServer;