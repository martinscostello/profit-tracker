import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: { type: String, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    category: { type: String },
    stockQuantity: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    unit: { type: String }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
