import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true }, // Local ID
    businessId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productName: String,
    quantity: { type: Number, required: true },
    revenue: { type: Number, required: true },
    cost: { type: Number, required: true },
    profit: { type: Number, required: true },
    date: { type: String, required: true }, // ISO Date String
}, { timestamps: true });

export const Sale = mongoose.model('Sale', saleSchema);
