import { ICollector } from "../../models/Collector";

export class DistrictDto {
    public readonly _id: string;
    public readonly name: string;

    constructor(district: any) {
        this._id = district._id.toString();
        this.name = district.name;
    }
}

export class ServiceAreaDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly location: string;
    public readonly postalCodes: string[];
    public readonly capacity: number;
    public readonly serviceDays: string[];

    constructor(serviceArea: any) {
        this._id = serviceArea._id.toString();
        this.name = serviceArea.name;
        this.location = serviceArea.location;
        this.postalCodes = serviceArea.postalCodes ?? [];
        this.capacity = serviceArea.capacity;
        this.serviceDays = serviceArea.serviceDays ?? [];
    }
}

export class CollectorAdminDto {
    public readonly _id: string;
    public readonly collectorId: string;
    public readonly name: string;
    public readonly email: string;
    public readonly phone: string;
    public readonly gender: "male" | "female";
    public readonly authProvider: "google" | "local";
    public readonly verificationStatus?: "pending" | "requested" | "approved" | "rejected";
    public readonly isVerified: boolean;
    public readonly editAccess: boolean;
    public readonly isBlocked: boolean;
    public readonly availabilityStatus: "available" | "unavailable" | "on_break";
    public readonly currentTasks: number;
    public readonly maxCapacity: number;
    public readonly district?: DistrictDto;
    public readonly serviceArea?: ServiceAreaDto;
    public readonly performanceMetrics: {
        avgRating: number;
        totalCollections: number;
    };
    public readonly idProofType?: string;
    public readonly idProofFrontUrl?: string;
    public readonly idProofBackUrl?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(collector: ICollector & { district?: any; serviceArea?: any }) {
        this._id = collector._id.toString();
        this.collectorId = collector.collectorId;
        this.name = collector.name;
        this.email = collector.email;
        this.phone = collector.phone;
        this.gender = collector.gender;
        this.authProvider = collector.authProvider;
        this.verificationStatus = collector.verificationStatus;
        this.isVerified = collector.isVerified ?? false;
        this.editAccess = collector.editAccess ?? false;
        this.isBlocked = collector.isBlocked ?? false;
        this.availabilityStatus = collector.availabilityStatus;
        this.currentTasks = collector.currentTasks;
        this.maxCapacity = collector.maxCapacity;

        this.district = collector.district ? new DistrictDto(collector.district) : undefined;
        this.serviceArea = collector.serviceArea ? new ServiceAreaDto(collector.serviceArea) : undefined;

        this.performanceMetrics = {
            avgRating: collector.performanceMetrics.avgRating,
            totalCollections: collector.performanceMetrics.totalCollections,
        };
        this.idProofType = collector.idProofType;
        this.idProofFrontUrl = collector.idProofFrontUrl;
        this.idProofBackUrl = collector.idProofBackUrl;
        this.createdAt = collector?.createdAt as Date;
        this.updatedAt = collector?.updatedAt as Date;
    }

    public static from(collector: ICollector & { district?: any; serviceArea?: any }): CollectorAdminDto {
        return new CollectorAdminDto(collector);
    }

    public static fromList(collectors: (ICollector & { district?: any; serviceArea?: any })[]): CollectorAdminDto[] {
        return collectors.map(CollectorAdminDto.from);
    }
}
