import { ICollection } from "../../models/Collection";
import { IUser } from "../external/external"

export class CollectionDto {
    public readonly _id: string;
    public readonly userId: string;
    public readonly collectionId: string;
    public readonly collectorId?: string;
    public readonly type: "waste" | "scrap";
    public readonly districtId: string;
    public readonly serviceAreaId: string;
    public readonly items: {
        categoryId: string;
        name: string;
        rate: number;
        qty: number;
    }[];
    public readonly estimatedCost: number;
    public readonly payment: {
        paymentId?: string;
        advanceAmount?: number;
        advancePaymentStatus?: "success" | "pending" | "failed" | "refunded";
        advancePaymentMethod?: "online" | "wallet";
        amount?: number;
        method?: "online" | "wallet" | "cash";
        status?: "pending" | "success" | "failed" | "requested";
        orderId?: string;
        paidAt?: Date;
    };
    public readonly preferredDate?: Date;
    public readonly instructions?: string;
    public readonly address: {
        name: string;
        mobile: string;
        pinCode: string;
        locality: string;
        addressLine: string;
    };
    public readonly location: {
        lat: number;
        long: number;
        updatedAt: Date;
    };
    public readonly status: "pending" | "confirmed" | "scheduled" | "in_progress" | "cancelled" | "completed";
    public readonly scheduledAt?: Date;
    public readonly collectionProof?: string;
    public readonly userFeedback?: {
        rating: number;
        comment: string;
    };
    public readonly cancellationReason?: string;
    public readonly proofs?: string[];
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public readonly user?: {
        userId: string;
        name: string;
        email: string;
        phone?: string;
    };

    constructor(collection: ICollection, user?: IUser) {
        this._id = collection._id.toString();
        this.userId = collection.userId;
        this.collectionId = collection.collectionId;
        this.collectorId = collection.collectorId?.toString();
        this.type = collection.type;
        this.districtId = collection.districtId;
        this.serviceAreaId = collection.serviceAreaId;
        this.items = collection.items.map((item) => ({
            categoryId: item.categoryId.toString(),
            name: item.name,
            rate: item.rate,
            qty: item.qty,
        }));
        this.estimatedCost = collection.estimatedCost;
        this.payment = collection.payment;
        this.preferredDate = collection.preferredDate;
        this.instructions = collection.instructions;
        this.address = collection.address;
        this.location = collection.location;
        this.status = collection.status;
        this.scheduledAt = collection.scheduledAt;
        this.collectionProof = collection.collectionProof;
        this.userFeedback = collection.userFeedback;
        this.cancellationReason = collection.cancellationReason;
        this.proofs = collection.proofs;
        this.createdAt = collection.createdAt;
        this.updatedAt = collection.updatedAt;

        if (user) {
            this.user = {
                userId: user.userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
            };
        }
    }

    public static from(collection: ICollection, user?: IUser): CollectionDto {
        return new CollectionDto(collection, user);
    }

    public static fromList(collections: ICollection[], users?: Map<string, IUser>
    ): CollectionDto[] {
        return collections.map((c) =>
            new CollectionDto(c, users?.get(c.userId.toString()))
        );
    }
}
