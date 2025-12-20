import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true }, // Local ID
    businessId: { type: String, required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true }
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);
