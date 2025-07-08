import { IAdminService } from '../interfaces/admin/IAdminService';
import { IAdmin } from '../models/Admin';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import { IUserRepository } from '../interfaces/user/IUserRepository';
import { ICollectorRepository } from '../interfaces/collector/ICollectorRepository';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/token';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { IUser } from '../models/User';
import { ICollector } from '../models/Collector';
import { IDistrict } from '../interfaces/external/locationService';
import { IServiceArea } from '../interfaces/external/locationService';
import axios from 'axios';
import RabbitMQ from '../utils/rabbitmq';

export class AdminService implements IAdminService {

    constructor(
        private adminRepository: IAdminRepository,
        private userRepository: IUserRepository,
        private collectorRepository: ICollectorRepository
    ) { };


    async createAdmin(email: string, password: string): Promise<IAdmin> {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const admin = await this.adminRepository.createAdmin({ email, password: hashedPassword });
            return admin;

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; admin: IAdmin }> {
        try {
            const admin = await this.adminRepository.findAdminByEmail(email);

            if (!admin) {
                throw new Error(MESSAGES.USER_NOT_FOUND);
            }

            const isCorrectPassword = await bcrypt.compare(password, admin?.password);

            if (!isCorrectPassword) {
                throw new Error(MESSAGES.INVALID_PASSWORD);
            }

            const accessToken = generateAccessToken(admin._id as string, 'admin');
            const refreshToken = generateRefreshToken(admin._id as string, 'admin');

            console.log("Login success full");

            return { accessToken, refreshToken, admin };

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async validateRefreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; }> {
        try {

            const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET as string);

            const user = await this.adminRepository.getAdminById(decoded.userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            console.log("decoded in service:", decoded);

            const accessToken = generateAccessToken(user._id as string, 'admin');
            const refreshToken = generateRefreshToken(user._id as string, 'admin');

            return { accessToken, refreshToken };

        } catch (error) {
            console.error('Error while storing refreshToken :', error);
            throw error;
        }
    }

    async getUsers(options: {
        search?: string;
        status?: string;
        sortField?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }): Promise<{ users: IUser[], totalItems: number, totalPages: number }> {
        try {
            const {
                search,
                status,
                sortField = 'name',
                sortOrder = 'asc',
                page = 1,
                limit = 10
            } = options;

            const filter: any = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            if (status && status !== 'all') {
                filter.isBlocked = status === 'blocked';
            }

            const sort: Record<string, 1 | -1> = {};
            sort[sortField] = sortOrder === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;
            const totalItems = await this.userRepository.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);

            const users = await this.userRepository.find(filter, {}, sort, skip, limit);

            return { users, totalItems, totalPages };
        } catch (error) {
            console.error('Error while fetching users:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getDistrictsByIds(districtIds: string[]): Promise<IDistrict[]> {
        try {
            const response = await axios.get(`${process.env.LOCATION_SERVICE_URL}/service-area/admin/districts/bulk`, {
                params: { ids: districtIds.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Error while fetching districts:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getServiceAreasByIds(serviceAreaIds: string[]): Promise<IServiceArea[]> {
        try {
            const response = await axios.get(`${process.env.LOCATION_SERVICE_URL}/service-area/admin/service-areas/bulk`, {
                params: { ids: serviceAreaIds.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Error while fetching service areas:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getCollector(collectorId: string): Promise<ICollector> {
        try {
            const projection = {
                password: 0,
                __v: 0
            }
            const collector = await this.collectorRepository.findById(collectorId, projection);
            if (!collector) {
                const error: any = new Error(MESSAGES.COLLECTOR_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
            return collector;
        } catch (error: any) {
            console.log("Error while fetching collector data!!!!!!!!!!!1 :", error.message);
            throw error;
        }
    }

    async getCollectors(queryOptions: {
        search?: string;
        status?: string;
        district?: string;
        serviceArea?: string;
        sortField?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }): Promise<{ collectors: Partial<ICollector>[], totalItems: number, totalPages: number }> {
        try {
            const {
                search,
                status,
                district,
                serviceArea,
                sortField = 'name',
                sortOrder = 'asc',
                page = 1,
                limit = 10
            } = queryOptions;

            const filter: any = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            if (district !== 'all') filter.district = district;
            if (serviceArea !== 'all') filter.serviceArea = serviceArea;
            if (status && status !== 'all') filter.isBlocked = status === 'blocked';

            const projection = {
                password: 0,
            }

            const sort: Record<string, 1 | -1> = {};
            sort[sortField] = sortOrder === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;

            const totalItems = await this.collectorRepository.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);
            console.log("filter :", filter);
            console.log("projection :", projection);
            console.log("sort :", sort);
            console.log("skip :", skip);
            console.log("limit :", limit);
            const collectors = await this.collectorRepository.find(filter, projection, sort, skip, limit);

            const districtIds = [...new Set(collectors.map(c => c.district).filter(Boolean))] as string[];
            const serviceAreaIds = [...new Set(collectors.map(c => c.serviceArea).filter(Boolean))] as string[];

            const [districts, serviceAreas] = await Promise.all([
                districtIds.length ? this.getDistrictsByIds(districtIds) : Promise.resolve([]),
                serviceAreaIds.length ? this.getServiceAreasByIds(serviceAreaIds) : Promise.resolve([])
            ]);
            // console.log("districts:", districts);
            // console.log("serviceAreas:", serviceAreas);

            const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
            const serviceAreaMap = new Map(serviceAreas.map(s => [s._id.toString(), s]));

            // console.log("districtMap:", districtMap);
            // console.log("serviceAreaMap:", serviceAreaMap);

            // return collectors;



            const enrichedCollectors = collectors.map(collector => {
                const plainCollector = collector.toObject();
                return {
                    ...plainCollector,
                    district: collector.district ? districtMap.get(collector.district) : null,
                    serviceArea: collector.serviceArea ? serviceAreaMap.get(collector.serviceArea) : null
                };
            });

            // console.log("enrichedCollectors:", enrichedCollectors);

            return { collectors: enrichedCollectors, totalItems, totalPages };

        } catch (error: any) {
            console.error('Error while fetching users:', error.message);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getAvailableCollectors(serviceArea: string, preferredDate: string): Promise<Partial<ICollector>[]> {
        try {
            const collectionDate = new Date(preferredDate);
            const dateKey = collectionDate.toISOString().split('T')[0];
            console.log("dateKey :", dateKey);
            const collectors = await this.adminRepository.getAvailableCollectors(serviceArea, dateKey);
            console.log("collectors :", collectors);
            return collectors;
        } catch (error) {
            console.error('Error while fetching available collectors:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getVerificationRequests(): Promise<ICollector[]> {
        try {
            const query = { verificationStatus: 'requested' };

            const collectors = await this.collectorRepository.find(query);

            const districtIds = [...new Set(collectors.map(c => c.district).filter(Boolean))] as string[];
            const serviceAreaIds = [...new Set(collectors.map(c => c.serviceArea).filter(Boolean))] as string[];

            const [districts, serviceAreas] = await Promise.all([
                districtIds.length ? this.getDistrictsByIds(districtIds) : Promise.resolve([]),
                serviceAreaIds.length ? this.getServiceAreasByIds(serviceAreaIds) : Promise.resolve([])
            ]);
            // console.log("districts:", districts);
            // console.log("serviceAreas:", serviceAreas);

            const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
            const serviceAreaMap = new Map(serviceAreas.map(s => [s._id.toString(), s]));

            // console.log("districtMap:", districtMap);
            // console.log("serviceAreaMap:", serviceAreaMap);

            // return collectors;



            const enrichedCollectors = collectors.map(collector => {
                const plainCollector = collector.toObject();
                return {
                    ...plainCollector,
                    district: collector.district ? districtMap.get(collector.district) : null,
                    serviceArea: collector.serviceArea ? serviceAreaMap.get(collector.serviceArea) : null
                };
            });
            
            return enrichedCollectors;
        } catch (error) {
            console.error('Error while fetching verification requests:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async updateVerificationStatus(id: string, status: string): Promise<ICollector | null> {
        try {
            if (status === 'approve') status = 'approved';
            if (status === 'reject') status = 'rejected';
            return this.collectorRepository.updateById(id, { verificationStatus: status });
        } catch (error) {
            console.error('Error while updating verification status:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async updateUserStatus(id: string): Promise<string> {
        try {

            const user = await this.userRepository.getUserById(id);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            await Promise.all([
                this.userRepository.updateStatusById(id, !user.isBlocked as boolean),
                RabbitMQ.publish('blocked-status', { clientId: id, isBlocked: !user.isBlocked })
            ]);

            return user?.isBlocked
                ? 'Unblocked successfully'
                : 'Blocked successfully';

        } catch (error: any) {
            console.log("Error while updating user status :", error.message);
            throw error;
        }
    }

    async updateCollectorStatus(id: string): Promise<string> {
        try {
            const collector = await this.collectorRepository.getCollectorById(id);

            if (!collector) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }

            await Promise.all([
                this.collectorRepository.updateStatusById(id, !collector.isBlocked as boolean),
                RabbitMQ.publish('blocked-status', { clientId: id, isBlocked: !collector.isBlocked })
            ]);

            return collector?.isBlocked
                ? 'Blocked successfully.'
                : 'Unblocked successfully.';

        } catch (error: any) {
            console.log("Error while updating collector status :", error.message);
            throw error;
        }
    }
}