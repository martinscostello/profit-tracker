export interface Product {
    id: string;
    businessId: string;
    name: string;
    costPrice: number;
    sellingPrice: number;
    category?: string;
    stockQuantity?: number;
    totalSold?: number;
    isActive: boolean;
    unit?: string;
}

export interface Sale {
    id: string;
    businessId: string;
    productId: string;
    productName: string; // Denormalized for simpler history
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    date: string; // ISO string
    createdAt?: number; // Timestamp for tie-breaking sort
}

export interface Expense {
    id: string;
    businessId: string;
    description: string;
    amount: number;
    category: string;
    date: string; // ISO string
}

export type Role = 'OWNER' | 'MANAGER' | 'SALES' | 'AUDITOR' | 'SUPERVISOR' | 'LOCKED';

export interface Permissions {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canAddSales: boolean;
    canEditSales: boolean;
    canViewSales: boolean; // Added
    canAddExpenses: boolean;
    canEditExpenses: boolean;
    canDeleteExpenses: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canManageCollaborators: boolean;
    canEditCompanyProfile: boolean;
}

export interface Collaborator {
    userId: string;
    name: string;
    role: Role;
    status: 'ACTIVE' | 'PENDING';
    email?: string;
    permissions?: Permissions;
}

export type SubscriptionPlan = 'FREE' | 'LITE' | 'ENTREPRENEUR' | 'UNLIMITED';

export interface BusinessProfile {
    id: string;
    name: string;
    type?: string;
    currency: string;
    isPro: boolean; // Computed or Legacy
    plan: SubscriptionPlan; // New Source of Truth
    onboardingCompleted: boolean;
    pin?: string;
    phoneNumber?: string;
    ownerId?: string;
    collaborators: Collaborator[];
    expenseCategories?: string[];
}
