import { IAdminService } from '../interfaces/admin/IAdminService';
import { IAdminRepository } from '../interfaces/admin/IAdminRepository';
import { IUserRepository } from '../interfaces/user/IUserRepository';
import { ICollectorRepository } from '../interfaces/collector/ICollectorRepository';
import { IRedisRepository } from "../interfaces/redis/IRedisRepository";
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/token';
import { HTTP_STATUS } from '../constants/httpStatus';
import { MESSAGES } from '../constants/messages';
import { getSignedProfileImageUrl } from "../utils/s3";
import { ICollector } from '../models/Collector';
import { IDistrict } from '../interfaces/external/locationService';
import { IServiceArea } from '../interfaces/external/locationService';
import axios from 'axios';
import { CollectorAdminDto } from "../dtos/response/CollectorAdminDto.dto";
import { AvailableCollectorDto } from "../dtos/response/availableCollectorDto.dto";
// import RabbitMQ from '../utils/rabbitmq';

import { AuthDTo } from "../dtos/response/auth.dto"
import { UserDto } from "../dtos/response/user.dto"
import { CollectorDto } from "../dtos/response/collector.dto"

export class AdminService implements IAdminService {

    constructor(
        private _adminRepository: IAdminRepository,
        private _userRepository: IUserRepository,
        private _collectorRepository: ICollectorRepository,
        private _redisRepository: IRedisRepository
    ) { };

    async createAdmin(email: string, password: string): Promise<AuthDTo> {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const admin = await this._adminRepository.create({ email, password: hashedPassword });
            return AuthDTo.from(admin);

        } catch (error) {
            console.error('Error while creating admin:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; admin: AuthDTo }> {
        try {
            const admin = await this._adminRepository.findOne({ email });

            if (!admin) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            const isCorrectPassword = await bcrypt.compare(password, admin?.password);

            if (!isCorrectPassword) {
                const error: any = new Error(MESSAGES.INVALID_PASSWORD);
                error.status = HTTP_STATUS.UNAUTHORIZED;
                throw error;
            }

            const accessToken = generateAccessToken(admin._id as string, 'admin');
            const refreshToken = generateRefreshToken(admin._id as string, 'admin');

            return { accessToken, refreshToken, admin: AuthDTo.from(admin) };

        } catch (error) {
            throw error;
        }
    }

    async validateRefreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; }> {
        try {

            const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET as string);

            const user = await this._adminRepository.findById(decoded.userId);

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
    }): Promise<{ users: UserDto[], totalItems: number, totalPages: number }> {
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
            const totalItems = await this._userRepository.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);

            const users = await this._userRepository.find(filter, {}, sort, skip, limit);

            const usersWithSignedUrls = await Promise.all(
                users.map(async (user) => {
                    const plainUser = user.toObject();

                    const signedProfileUrl = plainUser.profileUrl
                        ? await getSignedProfileImageUrl(plainUser.profileUrl)
                        : null;

                    plainUser.profileUrl = signedProfileUrl;

                    return UserDto.from(plainUser);
                })
            );

            return { users: usersWithSignedUrls, totalItems, totalPages };

            // return { users: UserDto.fromList(users), totalItems, totalPages };
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

    async getCollector(collectorId: string): Promise<CollectorDto> {
        try {
            const collector = await this._collectorRepository.findById(collectorId);
            if (!collector) {
                const error: any = new Error(MESSAGES.COLLECTOR_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            if (collector.profileUrl) {
                collector.profileUrl = await getSignedProfileImageUrl(collector.profileUrl);
            }

            return CollectorDto.from(collector);
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
    }): Promise<{ collectors: CollectorAdminDto[], totalItems: number, totalPages: number }> {
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

            const sort: Record<string, 1 | -1> = {};
            sort[sortField] = sortOrder === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;

            const totalItems = await this._collectorRepository.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limit);

            const collectors = await this._collectorRepository.find(filter, {}, sort, skip, limit);

            const districtIds = [...new Set(collectors.map(c => c.district).filter(Boolean))] as string[];
            const serviceAreaIds = [...new Set(collectors.map(c => c.serviceArea).filter(Boolean))] as string[];

            const [districts, serviceAreas] = await Promise.all([
                districtIds.length ? this.getDistrictsByIds(districtIds) : Promise.resolve([]),
                serviceAreaIds.length ? this.getServiceAreasByIds(serviceAreaIds) : Promise.resolve([])
            ]);

            const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
            const serviceAreaMap = new Map(serviceAreas.map(s => [s._id.toString(), s]));

            const enrichedCollectors = await Promise.all(
                collectors.map(async (collector) => {
                    const plainCollector = collector.toObject();

                    const signedProfileUrl = plainCollector.profileUrl
                        ? await getSignedProfileImageUrl(plainCollector.profileUrl)
                        : null;

                    const signedIdFrontUrl = plainCollector.idProofFrontUrl
                        ? await getSignedProfileImageUrl(plainCollector.idProofFrontUrl)
                        : null;

                    const signedIdBackUrl = plainCollector.idProofBackUrl
                        ? await getSignedProfileImageUrl(plainCollector.idProofBackUrl)
                        : null;

                    const enriched = {
                        ...plainCollector,
                        profileUrl: signedProfileUrl,
                        idProofFrontUrl: signedIdFrontUrl,
                        idProofBackUrl: signedIdBackUrl,
                        district: collector.district ? districtMap.get(collector.district) : null,
                        serviceArea: collector.serviceArea ? serviceAreaMap.get(collector.serviceArea) : null
                    };

                    return CollectorAdminDto.from(enriched);
                })
            );

            return { collectors: enrichedCollectors, totalItems, totalPages };
        } catch (error: any) {
            console.error('Error while fetching users:', error.message);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async getAvailableCollectors(serviceArea: string, preferredDate: string): Promise<AvailableCollectorDto[]> {
        try {
            const dateKey = new Date(preferredDate).toISOString().split('T')[0];
            console.log("dateKey :", dateKey);
            const collectors = await this._adminRepository.getAvailableCollectors(serviceArea, dateKey);
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

            const collectors = await this._collectorRepository.find(query);

            const districtIds = [...new Set(collectors.map(c => c.district).filter(Boolean))] as string[];
            const serviceAreaIds = [...new Set(collectors.map(c => c.serviceArea).filter(Boolean))] as string[];

            const [districts, serviceAreas] = await Promise.all([
                districtIds.length ? this.getDistrictsByIds(districtIds) : Promise.resolve([]),
                serviceAreaIds.length ? this.getServiceAreasByIds(serviceAreaIds) : Promise.resolve([])
            ]);

            const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
            const serviceAreaMap = new Map(serviceAreas.map(s => [s._id.toString(), s]));

            const enrichedCollectors = await Promise.all(
                collectors.map(async (collector) => {
                    const plainCollector = collector.toObject();

                    const signedProfileUrl = plainCollector.profileUrl
                        ? await getSignedProfileImageUrl(plainCollector.profileUrl)
                        : null;

                    const signedIdFrontUrl = plainCollector.idProofFrontUrl
                        ? await getSignedProfileImageUrl(plainCollector.idProofFrontUrl)
                        : null;

                    const signedIdBackUrl = plainCollector.idProofBackUrl
                        ? await getSignedProfileImageUrl(plainCollector.idProofBackUrl)
                        : null;

                    return {
                        ...plainCollector,
                        profileUrl: signedProfileUrl,
                        idProofFrontUrl: signedIdFrontUrl,
                        idProofBackUrl: signedIdBackUrl,
                        district: collector.district ? districtMap.get(collector.district) : null,
                        serviceArea: collector.serviceArea ? serviceAreaMap.get(collector.serviceArea) : null
                    };
                })
            );

            return enrichedCollectors;
        } catch (error) {
            console.error('Error while fetching verification requests:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    // async getVerificationRequests(): Promise<ICollector[]> {
    //     try {
    //         const query = { verificationStatus: 'requested' };

    //         const collectors = await this._collectorRepository.find(query);

    //         const districtIds = [...new Set(collectors.map(c => c.district).filter(Boolean))] as string[];
    //         const serviceAreaIds = [...new Set(collectors.map(c => c.serviceArea).filter(Boolean))] as string[];

    //         const [districts, serviceAreas] = await Promise.all([
    //             districtIds.length ? this.getDistrictsByIds(districtIds) : Promise.resolve([]),
    //             serviceAreaIds.length ? this.getServiceAreasByIds(serviceAreaIds) : Promise.resolve([])
    //         ]);

    //         const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
    //         const serviceAreaMap = new Map(serviceAreas.map(s => [s._id.toString(), s]));

    //         const enrichedCollectors = await Promise.all(
    //             collectors.map(async (collector) => {
    //                 const plainCollector = collector.toObject();

    //                 const signedProfileUrl = plainCollector.profileUrl
    //                     ? await getSignedProfileImageUrl(plainCollector.profileUrl)
    //                     : null;

    //                 const signedIdFrontUrl = plainCollector.idProofFrontUrl
    //                     ? await getSignedProfileImageUrl(plainCollector.idProofFrontUrl)
    //                     : null;

    //                 const signedIdBackUrl = plainCollector.idProofBackUrl
    //                     ? await getSignedProfileImageUrl(plainCollector.idProofBackUrl)
    //                     : null;

    //                 return {
    //                     ...plainCollector,
    //                     profileUrl: signedProfileUrl,
    //                     idProofFrontUrl: signedIdFrontUrl,
    //                     idProofBackUrl: signedIdBackUrl,
    //                     district: collector.district ? districtMap.get(collector.district) : null,
    //                     serviceArea: collector.serviceArea ? serviceAreaMap.get(collector.serviceArea) : null
    //                 };
    //             })
    //         );

    //         return enrichedCollectors;
    //     } catch (error) {
    //         console.error('Error while fetching verification requests:', error);
    //         throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
    //     }
    // }

    async updateVerificationStatus(id: string, status: string): Promise<ICollector | null> {
        try {
            if (status === 'approve') status = 'approved';
            if (status === 'reject') status = 'rejected';
            return this._collectorRepository.updateById(id, { verificationStatus: status });
        } catch (error) {
            console.error('Error while updating verification status:', error);
            throw new Error(error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR);
        }
    }

    async updateUserStatus(userId: string): Promise<string> {
        try {

            const user = await this._userRepository.findById(userId);

            if (!user) {
                const error: any = new Error(MESSAGES.USER_NOT_FOUND);
                error.status = HTTP_STATUS.NOT_FOUND;
                throw error;
            }

            await Promise.all([
                this._userRepository.updateById(userId, { isBlocked: !user.isBlocked as boolean }),
                this._redisRepository.set(`is-blocked:${userId}`, !user.isBlocked, 3600),
            ]);

            return user?.isBlocked
                ? 'Unblocked successfully'
                : 'Blocked successfully';

        } catch (error: any) {
            console.log("Error while updating user status :", error.message);
            throw error;
        }
    }

    async updateCollectorStatus(collectorId: string): Promise<string> {
        try {
            const collector = await this._collectorRepository.findById(collectorId);

            if (!collector) {
                const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
                error.status = HTTP_STATUS.GONE;
                throw error;
            }

            await Promise.all([
                this._collectorRepository.updateById(collectorId, { isBlocked: !collector.isBlocked as boolean }),
                this._redisRepository.set(`is-blocked:${collectorId}`, !collector.isBlocked, 3600),
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