import api from '../utils/api';
import type { BusinessProfile, Product, Sale, Expense } from '../types';

export const ApiService = {
    // Businesses
    getProfile: () => api.get('/auth/me').then(r => r.data),
    getBusinesses: () => api.get('/businesses').then(r => r.data),
    createBusiness: (business: Partial<BusinessProfile>) => api.post('/businesses', business).then(r => r.data),
    updateBusiness: (id: string, updates: Partial<BusinessProfile>) => api.patch(`/businesses/${id}`, updates).then(r => r.data),
    leaveBusiness: (id: string) => api.post(`/businesses/${id}/leave`).then(r => r.data),

    // Products
    getProducts: (businessId: string) => api.get(`/products/${businessId}`).then(r => r.data),
    addProduct: (product: Partial<Product>) => api.post('/products', product).then(r => r.data),
    updateProduct: (id: string, updates: Partial<Product>) => api.patch(`/products/${id}`, updates).then(r => r.data),
    deleteProduct: (businessId: string, id: string) => api.delete(`/products/${businessId}/${id}`).then(r => r.data),

    // Sales & Expenses
    getSales: (businessId: string) => api.get(`/data/sales/${businessId}`).then(r => r.data),
    addSale: (sale: Partial<Sale>) => api.post('/data/sales', sale).then(r => r.data),
    updateSale: (id: string, updates: Partial<Sale>) => api.patch(`/data/sales/${id}`, updates).then(r => r.data),
    deleteSale: (businessId: string, id: string) => api.delete(`/data/sales/${businessId}/${id}`).then(r => r.data),

    getExpenses: (businessId: string) => api.get(`/data/expenses/${businessId}`).then(r => r.data),
    addExpense: (expense: Partial<Expense>) => api.post('/data/expenses', expense).then(r => r.data),
    deleteExpense: (businessId: string, id: string) => api.delete(`/data/expenses/${businessId}/${id}`).then(r => r.data),

    // Collaborators & Invitations
    createInvitation: (businessId: string) => api.post(`/businesses/${businessId}/invite`).then(r => r.data),
    joinBusiness: (code: string) => api.post(`/businesses/join`, { code }).then(r => r.data),
    updateCollaborator: (businessId: string, userId: string, updates: any) => api.patch(`/businesses/${businessId}/collaborators/${userId}`, updates).then(r => r.data),
    removeCollaborator: (businessId: string, userId: string) => api.delete(`/businesses/${businessId}/collaborators/${userId}`).then(r => r.data),
    async getDashboardStats(businessId: string) {
        const res = await api.get(`/reports/${businessId}/dashboard-stats`);
        return res.data;
    },

    async getSalesTrend(businessId: string) {
        const res = await api.get(`/reports/${businessId}/sales-trend`);
        return res.data;
    },

    async getTopProducts(businessId: string) {
        const res = await api.get(`/reports/${businessId}/top-products`);
        return res.data;
    },

    async getExpenseBreakdown(businessId: string) {
        const res = await api.get(`/reports/${businessId}/expense-breakdown`);
        return res.data;
    }
};
