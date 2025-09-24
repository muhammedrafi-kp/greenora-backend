export interface IUser {
    userId: string;
    name: string;
    email: string;
    phone: string;
}

export interface ICollector {
    id: string;
    collectorId: string;
    name: string;
    email: string;
    phone: string;
    availabilityStatus: string;
    currentTasks: number;
    maxCapacity: number;
}

export interface INotification {
    userId: string;
    title: string;
    message: string;
    url: string;
}