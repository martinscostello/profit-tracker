import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getDefaultPermissions } from '../utils/permissions';
import type { Permissions, Role } from '../types';

export function usePermissions() {
    const { currentUser } = useAuth();
    const { business } = useData();

    if (!business) {
        return {
            role: 'MANAGER' as Role, // Default restrictive
            permissions: getDefaultPermissions('MANAGER'),
            can: (_action: keyof Permissions) => false
        };
    }

    // 1. Offline / Local Owner
    // If we have a business but no logged-in user, AND the business has no ownerId (local only),
    // we treat the local user as the Owner.
    // 1. Offline / Guest User
    if (!currentUser) {
        // Offline-First Logic:
        // A. Local-Only Business (No Cloud ID): User is Owner (Device Owner).
        // B. Cloud Business (User is Owner): User is Owner (Cached).
        // C. Cloud Business (User is Manager): LOCKOUT.

        const isCloudBusiness = !!business.ownerId;
        const isLocalOwner = (business as any)._isLocalOwner;

        if (isCloudBusiness && !isLocalOwner) {
            // LOCKOUT
            return {
                role: 'LOCKED' as Role, // Custom role for UI handling
                permissions: getDefaultPermissions('MANAGER'), // Fallback, but `can` will return false
                can: (_action: keyof Permissions) => false
            };
        }

        const perms = getDefaultPermissions('OWNER');
        return {
            role: 'OWNER' as Role,
            permissions: perms,
            can: (action: keyof Permissions) => perms[action]
        };
    }

    // Check if Owner
    if (business.ownerId === currentUser.id || !business.ownerId) {
        // Use Owner permissions
        const perms = getDefaultPermissions('OWNER');
        return {
            role: 'OWNER' as Role,
            permissions: perms,
            can: (action: keyof Permissions) => perms[action]
        };
    }

    // Find Collaborator
    const collaborator = business.collaborators?.find(c => c.userId === currentUser.id);

    if (collaborator) {
        const perms = collaborator.permissions || getDefaultPermissions(collaborator.role);
        return {
            role: collaborator.role,
            permissions: perms,
            can: (action: keyof Permissions) => perms[action]
        };
    }

    // Fallback (Not a collaborator, maybe just viewing public info? unlikely in this app structure)
    return {
        role: 'MANAGER' as Role,
        permissions: getDefaultPermissions('MANAGER'),
        can: (_action: keyof Permissions) => false
    };
}
