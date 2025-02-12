import { Schema, model, Document, Types } from "mongoose";

export interface IServiceArea extends Document {
    name: string;
    districtId: Types.ObjectId;
    center: {
        type: 'Point';
        coordinates: [number, number];
    };
    location: string;
    capacity: number;
    serviceDays: string[];
    postalCodes:string[];
    collectors: Types.ObjectId[];
    isActive: boolean;
}

const serviceAreaSchema = new Schema<IServiceArea>({
    name: { type: String, required: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true },
    center: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    serviceDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    postalCodes:[{type:String}],
    collectors: [{ type: Schema.Types.ObjectId, ref: 'Collector' }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

serviceAreaSchema.index({ center: '2dsphere' });

const ServiceArea = model<IServiceArea>('ServiceArea', serviceAreaSchema);
export default ServiceArea;