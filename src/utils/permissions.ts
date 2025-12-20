import type { Permissions, Role } from '../types';

export const getDefaultPermissions = (role: Role): Permissions => {
    switch (role) {
        case 'OWNER':
            return {
                canAddProducts: true, canEditProducts: true, canDeleteProducts: true,
                canAddSales: true, canEditSales: true, canViewSales: true,
                canAddExpenses: true, canEditExpenses: true, canDeleteExpenses: true,
                canViewReports: true, canManageSettings: true, canManageCollaborators: true,
                canEditCompanyProfile: true
            };
        case 'MANAGER':
            return {
                canAddProducts: true, canEditProducts: true, canDeleteProducts: true,
                canAddSales: true, canEditSales: true, canViewSales: true,
                canAddExpenses: false, canEditExpenses: false, canDeleteExpenses: false,
                canViewReports: true, canManageSettings: false, canManageCollaborators: false,
                canEditCompanyProfile: false
            };
        case 'SUPERVISOR':
            return {
                canAddProducts: true, canEditProducts: true, canDeleteProducts: false,
                canAddSales: true, canEditSales: true, canViewSales: true,
                canAddExpenses: true, canEditExpenses: true, canDeleteExpenses: false,
                canViewReports: true, canManageSettings: false, canManageCollaborators: false,
                canEditCompanyProfile: false
            };
        case 'SALES':
            return {
                canAddProducts: false, canEditProducts: false, canDeleteProducts: false,
                canAddSales: true, canEditSales: false, canViewSales: true, // Sales person needs to view sales? Usually yes.
                canAddExpenses: false, canEditExpenses: false, canDeleteExpenses: false,
                canViewReports: false, canManageSettings: false, canManageCollaborators: false,
                canEditCompanyProfile: false
            };
        case 'AUDITOR':
            return {
                canAddProducts: false, canEditProducts: false, canDeleteProducts: false,
                canAddSales: false, canEditSales: false, canViewSales: true,
                canAddExpenses: false, canEditExpenses: false, canDeleteExpenses: false,
                canViewReports: true, canManageSettings: false, canManageCollaborators: false,
                canEditCompanyProfile: false
            };
        default:
            return {
                canAddProducts: false, canEditProducts: false, canDeleteProducts: false,
                canAddSales: false, canEditSales: false, canViewSales: false,
                canAddExpenses: false, canEditExpenses: false, canDeleteExpenses: false,
                canViewReports: false, canManageSettings: false, canManageCollaborators: false,
                canEditCompanyProfile: false
            };
    }
};

export const PermissionLabels: Record<keyof Permissions, string> = {
    canAddProducts: 'Add Products',
    canEditProducts: 'Edit Products',
    canDeleteProducts: 'Delete Products',
    canAddSales: 'Add Sales',
    canEditSales: 'Edit Sales',
    canViewSales: 'View Sales History',
    canAddExpenses: 'Add Expenses',
    canEditExpenses: 'Edit Expenses',
    canDeleteExpenses: 'Delete Expenses',
    canViewReports: 'View Reports',
    canManageSettings: 'Manage Settings',
    canManageCollaborators: 'Manage Collaborators',
    canEditCompanyProfile: 'Partner Access (Edit Company Profile)'
};
