import { IDistrict } from "../../models/District";

export class DistrictDto {
    public readonly _id: string;
    public readonly name: string;

    constructor(district: IDistrict) {
        this._id = district._id.toString();
        this.name = district.name;
    }

    public static from(district: IDistrict): DistrictDto {
        return new DistrictDto(district);
    }

    public static fromList(districts: IDistrict[]): DistrictDto[] {
        return districts.map(district => new DistrictDto(district));
    }
}