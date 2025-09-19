import { IDistrict } from "../../models/District";
import { IServiceArea } from "../../models/ServiceArea";
import { ServiceAreaDto } from "./serviceArea.dto";

export class DistrictWithAreasDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly serviceAreas: ServiceAreaDto[];

    constructor(district: IDistrict & { serviceAreas: IServiceArea[] }) {
        this._id = district._id.toString();
        this.name = district.name;
        this.serviceAreas = ServiceAreaDto.fromList(district.serviceAreas);
    }

    static from(district: IDistrict & { serviceAreas: IServiceArea[] }): DistrictWithAreasDto {
        return new DistrictWithAreasDto(district);
    }

    static fromList(districts: (IDistrict & { serviceAreas: IServiceArea[] })[]): DistrictWithAreasDto[] {
        return districts.map(d => new DistrictWithAreasDto(d));
    }
}
