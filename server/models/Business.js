import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['OWNER', 'MANAGER', 'SALES', 'AUDITOR', 'SUPERVISOR'], default: 'MANAGER' },
    status: { type: String, enum: ['ACTIVE', 'PENDING'], default: 'ACTIVE' },
    permissions: {
        canAddProducts: Boolean,
        canEditProducts: Boolean,
        canDeleteProducts: Boolean,
        canAddSales: Boolean,
        canEditSales: Boolean,
        canViewSales: Boolean,
        canAddExpenses: Boolean,
        canEditExpenses: Boolean,
        canDeleteExpenses: Boolean,
        canViewReports: Boolean,
        canManageSettings: Boolean,
        canManageCollaborators: Boolean,
        canEditCompanyProfile: Boolean
    }
});

const businessSchema = new mongoose.Schema({
    id: { type: String, unique: true, index: true }, // We keep the string ID for frontend compatibility
    name: { type: String, required: true },
    type: { type: String },
    currency: { type: String, default: '₦' },
    isPro: { type: Boolean, default: false },
    plan: { type: String, enum: ['FREE', 'LITE', 'ENTREPRENEUR', 'UNLIMITED'], default: 'FREE' },
    onboardingCompleted: { type: Boolean, default: false },
    pin: { type: String },
    phoneNumber: { type: String },
    ownerId: { type: String, required: true },
    collaborators: [collaboratorSchema],
    expenseCategories: [String],
    inviteCode: { type: String, index: true },
    inviteExpiry: Date,
    taxSettings: {
        businessType: { type: String, enum: ['SOLO', 'REGISTERED', 'LIMITED'], default: 'SOLO' },
        hasExemptItems: { type: String, enum: ['YES', 'NO', 'IDK'], default: 'IDK' }
    }
}, { timestamps: true });

export const Business = mongoose.model('Business', businessSchema);
