import { Schema, model, Document, Types } from "mongoose";

export interface IDistrict extends Document {
    name: string;
    serviceAreas: Types.ObjectId[];
    isActive: boolean;
}

const districtSchema = new Schema<IDistrict>({
    name: { type: String, required: true, unique: true },
    serviceAreas: [{ type: Schema.Types.ObjectId, ref: 'ServiceArea' }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const District = model<IDistrict>('District', districtSchema);
export default District;