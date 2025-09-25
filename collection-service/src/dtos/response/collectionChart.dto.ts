export interface ICollectionTypeData {
    type: "waste" | "scrap";
    count: number;
    percentage: number;
}

export interface ICollectionStatusData {
    status: "confirmed" | "cancelled" | "completed" | "scheduled";
    count: number;
    percentage: number;
}

export interface IItemTypeData {
    name: string;
    qty: number;
    percentage: number;
}

export interface ICollectionChartData {
    collectionTypeData: ICollectionTypeData[];
    collectionStatusData: ICollectionStatusData[];
}

export interface ICollectorCollectionChartData {
    collectionTypeData: ICollectionTypeData[];
    itemType: IItemTypeData[];
}