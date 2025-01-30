import { Schema, model, Document, Decimal128 } from "mongoose";

export interface ICategory extends Document {
    name: string;
    type: "waste" | "scrap";
    description?: string;
    rate?: number;
    isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["waste", "scrap"], required: true },
        description: { type: String, required: true },
        rate: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Category = model<ICategory>("Category", categorySchema);
export default Category;