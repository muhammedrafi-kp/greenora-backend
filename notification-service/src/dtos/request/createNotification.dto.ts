export interface CreateNotificationDto {
    userId: string;
    title: string;
    message: string;
    url?: string;
}
