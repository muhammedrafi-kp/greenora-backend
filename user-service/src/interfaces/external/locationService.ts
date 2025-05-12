export interface IDistrict  {
    _id: string;
    name: string;
    serviceAreas: string[];
    isActive: boolean;
}

export interface IServiceArea {
    _id: string;
    name: string;
    districtId: string;
    center: {
        type: 'Point';
        coordinates: [number, number];
    };
    location: string;
    capacity: number;
    serviceDays: string[];
    postalCodes:string[];
    collectors: string[];
    isActive: boolean;
}