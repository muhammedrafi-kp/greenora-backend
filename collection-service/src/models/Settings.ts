import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: number;
  description?: string;
  updatedBy?: string;
  updatedAt: Date;
  isActive: boolean;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    description: { type: String },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISetting>("Setting", SettingSchema);
