import { ICollector } from "../../models/Collector";

export class CollectorDto {
  public readonly _id: string;
  public readonly collectorId: string;
  public readonly name: string;
  public readonly email: string;
  public readonly phone: string;
  public readonly gender: "male" | "female";
  public readonly district?: string;
  public readonly serviceArea?: string;
  public readonly profileUrl?: string;
  public readonly authProvider: "google" | "local";
  public readonly verificationStatus?: "pending" | "requested" | "approved" | "rejected";
  public readonly isVerified?: boolean;
  public readonly isBlocked?: boolean;
  public readonly availabilityStatus: "available" | "unavailable" | "on_break";
  public readonly currentTasks: number;
  public readonly maxCapacity: number;
  public readonly totalCollections: number;
  public readonly avgRating: number;
  public readonly idProofType?: string;
  public readonly idProofFrontUrl?: string;
  public readonly idProofBackUrl?: string;
  public readonly editAccess?:boolean
  
  constructor(collector: ICollector) {
    this._id = collector._id.toString();
    this.collectorId = collector.collectorId;
    this.name = collector.name;
    this.email = collector.email;
    this.phone = collector.phone;
    this.gender = collector.gender;
    this.district = collector.district;
    this.serviceArea = collector.serviceArea;
    this.profileUrl = collector.profileUrl;
    this.authProvider = collector.authProvider;
    this.verificationStatus = collector.verificationStatus;
    this.isVerified = collector.isVerified;
    this.isBlocked = collector.isBlocked;
    this.availabilityStatus = collector.availabilityStatus;
    this.currentTasks = collector.currentTasks;
    this.maxCapacity = collector.maxCapacity;
    this.totalCollections = collector.performanceMetrics.totalCollections;
    this.avgRating = collector.performanceMetrics.avgRating;
    this.idProofType = collector.idProofType;
    this.idProofFrontUrl = collector.idProofFrontUrl;
    this.idProofBackUrl = collector.idProofBackUrl;
    this.editAccess = collector.editAccess;
  }


  public static from(collector: ICollector): CollectorDto {
    return new CollectorDto(collector);
  }

  public static fromList(collectors: ICollector[]): CollectorDto[] {
    return collectors.map(CollectorDto.from);
  }
}
