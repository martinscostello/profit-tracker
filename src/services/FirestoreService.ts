import type { BusinessProfile, Collaborator } from '../types';
import { db } from '../config/firebase';
import {
    doc, setDoc, updateDoc, arrayUnion,
    deleteDoc, runTransaction, writeBatch, serverTimestamp
} from "firebase/firestore";
import { getDefaultPermissions } from '../utils/permissions';

interface Invitation {
    code: string;
    businessId: string;
    businessName: string;
    senderId: string;
    expiresAt: number;
}

export const FirestoreService = {
    /**
     * Creates a 6-digit invitation code for a business in Firestore
     */
    async createInvitation(businessId: string, businessName: string, userId: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

        await setDoc(doc(db, "invitations", code), {
            code,
            businessId,
            businessName,
            senderId: userId,
            expiresAt,
            createdAt: serverTimestamp()
        });

        return code;
    },

    /**
     * Joins a business as a manager using a transaction
     */
    async joinBusiness(code: string, user: any): Promise<{ success: boolean; business: BusinessProfile }> {
        return await runTransaction(db, async (transaction) => {
            // 1. Get Invitation
            const inviteRef = doc(db, "invitations", code);
            const inviteSnap = await transaction.get(inviteRef);

            if (!inviteSnap.exists()) {
                throw new Error("Invalid pairing code");
            }

            const inviteData = inviteSnap.data() as Invitation;
            if (Date.now() > inviteData.expiresAt) {
                throw new Error("Pairing code has expired");
            }

            // 2. Get Business
            const businessRef = doc(db, "businesses", inviteData.businessId);
            const businessSnap = await transaction.get(businessRef);

            if (!businessSnap.exists()) {
                throw new Error("Business not found (Process mismatch. Ask owner to sync first.)");
            }

            const businessData = businessSnap.data() as BusinessProfile;

            // Check if already joined
            const isCollaborator = businessData.collaborators?.some(c => c.userId === user.uid);
            if (isCollaborator) {
                throw new Error("You are already a collaborator in this business");
            }

            // 3. Add User to Business Collaborators
            const newCollaborator = {
                userId: user.uid,
                name: user.displayName || 'Partner',
                role: 'MANAGER',
                permissions: getDefaultPermissions('MANAGER'),
                status: 'ACTIVE'
            };

            transaction.update(businessRef, {
                collaborators: arrayUnion(newCollaborator)
            });

            // 4. Add Business to User's "Shared Businesses"
            // Note: We'll store a shallow copy or reference in users/{uid}
            const userRef = doc(db, "users", user.uid);
            // Ensure user doc exists (merge: true equivalent for update)
            transaction.set(userRef, {
                email: user.email,
                displayName: user.displayName,
                lastActive: serverTimestamp()
            }, { merge: true });

            transaction.update(userRef, {
                sharedBusinesses: arrayUnion({
                    id: businessData.id,
                    name: businessData.name
                })
            });

            // 5. Delete Invitation (One-time use)
            transaction.delete(inviteRef);

            return {
                success: true,
                business: {
                    ...businessData,
                    collaborators: [...(businessData.collaborators || []), newCollaborator as any]
                }
            };
        });
    },

    /**
     * Syncs a local business to Firestore (Called by Owner)
     */
    async syncBusiness(business: Partial<BusinessProfile>): Promise<void> {
        if (!business.id) return;

        await setDoc(doc(db, "businesses", business.id), {
            ...business,
            lastSynced: serverTimestamp()
        }, { merge: true });
    },

    /**
     * Create a new business in Firestore
     */
    async createBusiness(business: BusinessProfile, ownerId: string): Promise<void> {
        await setDoc(doc(db, "businesses", business.id), {
            ...business,
            ownerId,
            createdAt: serverTimestamp(),
            collaborators: [
                { userId: ownerId, name: 'Owner', role: 'OWNER', status: 'ACTIVE' }
            ]
        });
    },

    // --- Sub-collection Operations ---

    async addProduct(businessId: string, product: any): Promise<void> {
        await setDoc(doc(db, "businesses", businessId, "products", product.id), product);
    },

    async addSale(businessId: string, sale: any): Promise<void> {
        await setDoc(doc(db, "businesses", businessId, "sales", sale.id), sale);
    },

    async addExpense(businessId: string, expense: any): Promise<void> {
        await setDoc(doc(db, "businesses", businessId, "expenses", expense.id), expense);
    },

    async updateProduct(businessId: string, productId: string, updates: any): Promise<void> {
        await updateDoc(doc(db, "businesses", businessId, "products", productId), updates);
    },

    async deleteProduct(businessId: string, productId: string): Promise<void> {
        await deleteDoc(doc(db, "businesses", businessId, "products", productId));
    },

    async updateSale(businessId: string, saleId: string, updates: any): Promise<void> {
        await updateDoc(doc(db, "businesses", businessId, "sales", saleId), updates);
    },

    async deleteSale(businessId: string, saleId: string): Promise<void> {
        await deleteDoc(doc(db, "businesses", businessId, "sales", saleId));
    },

    async updateExpense(businessId: string, expenseId: string, updates: any): Promise<void> {
        await updateDoc(doc(db, "businesses", businessId, "expenses", expenseId), updates);
    },

    async deleteExpense(businessId: string, expenseId: string): Promise<void> {
        await deleteDoc(doc(db, "businesses", businessId, "expenses", expenseId));
    },

    async updateCollaborator(businessId: string, userId: string, updates: Partial<Collaborator>): Promise<void> {
        const busRef = doc(db, "businesses", businessId);
        // We need to read-modify-write to update an item in an array
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(busRef);
            if (!docSnap.exists()) throw new Error("Business not found");

            const data = docSnap.data() as BusinessProfile;
            const updatedCollaborators = data.collaborators.map(c =>
                c.userId === userId ? { ...c, ...updates } : c
            );

            transaction.update(busRef, { collaborators: updatedCollaborators });
        });
    },

    async leaveBusiness(businessId: string, userId: string): Promise<void> {
        const busRef = doc(db, "businesses", businessId);
        const userRef = doc(db, "users", userId);

        await runTransaction(db, async (transaction) => {
            const busSnap = await transaction.get(busRef);
            const userSnap = await transaction.get(userRef);

            if (!busSnap.exists()) throw new Error("Business not found");
            if (!userSnap.exists()) throw new Error("User profile not found");

            const busData = busSnap.data() as BusinessProfile;
            const userData = userSnap.data();

            // 1. Remove from Business Collaborators
            const updatedCollaborators = busData.collaborators.filter(c => c.userId !== userId);
            transaction.update(busRef, { collaborators: updatedCollaborators });

            // 2. Remove from User Shared Businesses
            if (userData.sharedBusinesses) {
                const updatedShared = userData.sharedBusinesses.filter((b: any) => b.id !== businessId);
                transaction.update(userRef, { sharedBusinesses: updatedShared });
            }
        });
    },

    // Batch Sync for Migration
    async batchSyncData(businessId: string, products: any[], sales: any[], expenses: any[]): Promise<void> {
        const batch = writeBatch(db); // Correct modular SDK usage

        let count = 0;

        // Only doing a simple batch for now, assuming small initial data
        // For larger data, we should create new batches every 500 ops
        // But preventing 'batch' from running if empty

        products.forEach(p => {
            const ref = doc(db, "businesses", businessId, "products", p.id);
            batch.set(ref, p);
            count++;
        });
        sales.forEach(s => {
            const ref = doc(db, "businesses", businessId, "sales", s.id);
            batch.set(ref, s);
            count++;
        });
        expenses.forEach(e => {
            const ref = doc(db, "businesses", businessId, "expenses", e.id);
            batch.set(ref, e);
            count++;
        });

        if (count > 0) await batch.commit();
    },
    async batchDeleteSales(businessId: string, saleIds: string[]): Promise<void> {
        // Firestore limits batches to 500 operations. 
        // For simplicity assuming <500 for now, or we chunk it.
        // Given 'All' sales might be >500, we should chunk.

        const chunks = [];
        for (let i = 0; i < saleIds.length; i += 500) {
            chunks.push(saleIds.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const newBatch = writeBatch(db);
            chunk.forEach(id => {
                const ref = doc(db, "businesses", businessId, "sales", id);
                newBatch.delete(ref);
            });
            await newBatch.commit();
        }
    }
};
