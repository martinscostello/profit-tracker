import api from '../utils/api';
import type { BusinessProfile, Product, Sale, Expense } from '../types';

export const ApiService = {
    // Businesses
    getProfile: () => api.get('/auth/me').then((r: any) => r.data),
    getBusinesses: () => api.get('/businesses').then((r: any) => r.data),
    createBusiness: (business: Partial<BusinessProfile>) => api.post('/businesses', business).then((r: any) => r.data),
    updateBusiness: (id: string, updates: Partial<BusinessProfile>) => api.patch(`/businesses/${id}`, updates).then((r: any) => r.data),
    leaveBusiness: (id: string) => api.post(`/businesses/${id}/leave`).then((r: any) => r.data),
    deleteBusiness: (id: string) => api.delete(`/businesses/${id}`).then((r: any) => r.data),

    // Products
    getProducts: (businessId: string) => api.get(`/products/${businessId}`).then((r: any) => r.data),
    addProduct: (product: Partial<Product>) => api.post('/products', product).then((r: any) => r.data),
    updateProduct: (id: string, updates: Partial<Product>) => api.patch(`/products/${id}`, updates).then((r: any) => r.data),
    deleteProduct: (businessId: string, id: string) => api.delete(`/products/${businessId}/${id}`).then((r: any) => r.data),

    // Sales & Expenses
    getSales: (businessId: string) => api.get(`/data/sales/${businessId}`).then((r: any) => r.data),
    addSale: (sale: Partial<Sale>) => api.post('/data/sales', sale).then((r: any) => r.data),
    updateSale: (id: string, updates: Partial<Sale>) => api.patch(`/data/sales/${id}`, updates).then((r: any) => r.data),
    deleteSale: (businessId: string, id: string) => api.delete(`/data/sales/${businessId}/${id}`).then((r: any) => r.data),

    getExpenses: (businessId: string) => api.get(`/data/expenses/${businessId}`).then((r: any) => r.data),
    addExpense: (expense: Partial<Expense>) => api.post('/data/expenses', expense).then((r: any) => r.data),
    deleteExpense: (businessId: string, id: string) => api.delete(`/data/expenses/${businessId}/${id}`).then((r: any) => r.data),

    // Collaborators & Invitations
    createInvitation: (businessId: string) => api.post(`/businesses/${businessId}/invite`).then((r: any) => r.data),
    joinBusiness: (code: string) => api.post(`/businesses/join`, { code }).then((r: any) => r.data),
    updateCollaborator: (businessId: string, userId: string, updates: any) => api.patch(`/businesses/${businessId}/collaborators/${userId}`, updates).then((r: any) => r.data),
    removeCollaborator: (businessId: string, userId: string) => api.delete(`/businesses/${businessId}/collaborators/${userId}`).then((r: any) => r.data),
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
