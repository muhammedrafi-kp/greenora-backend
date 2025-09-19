import { IServiceArea } from "../../models/ServiceArea";

export class ServiceAreaDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly location: string;
    public readonly postalCodes: string[];
    public readonly capacity: number;
    public readonly serviceDays: string[];
    public readonly collectors: string[];

    constructor(serviceArea: IServiceArea) {
        this._id = serviceArea._id.toString();
        this.name = serviceArea.name;
        this.location = serviceArea.location;
        this.postalCodes = serviceArea.postalCodes;
        this.capacity = serviceArea.capacity;
        this.serviceDays = serviceArea.serviceDays;
        this.collectors = serviceArea.collectors.map(c => c.toString());
    }

    public static from(serviceArea: IServiceArea): ServiceAreaDto {
        return new ServiceAreaDto(serviceArea);
    }

    public static fromList(serviceAreas: IServiceArea[]): ServiceAreaDto[] {
        return serviceAreas.map(serviceArea => new ServiceAreaDto(serviceArea));
    }
}

