import { Schema, model, Document, Types } from "mongoose";

export interface IAddress extends Document {
    userId: Types.ObjectId;
    name: string;
    mobile: string;
    districtId: Types.ObjectId;
    serviceAreaId: Types.ObjectId;
    pinCode: string;
    locality: string;
    addressLine: string;
}

const addressSchema = new Schema<IAddress>({
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true },
    serviceAreaId: { type: Schema.Types.ObjectId, ref: 'ServiceArea', required: true },
    pinCode: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    addressLine: { type: String, required: [true, 'Address line is required'], trim: true }
}, { timestamps: true });

addressSchema.index({ userId: 1, districtId: 1, serviceAreaId: 1 });

const Address = model<IAddress>('Address', addressSchema);
export default Address;
