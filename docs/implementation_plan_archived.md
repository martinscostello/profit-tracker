# Data Isolation Bug Fix Plan

## Goal
Ensure that Products, Sales, and History are strictly isolated between businesses, specifically in offline mode.

## Problem
Data imported or created in one business is visible in others. This suggests missing `businessId` filtering in local storage queries.

## User Review Required
None so far.

## Proposed Changes
## Proposed Changes
### Frontend
#### [MODIFY] src/services/OfflineStorage.ts (or equivalent)
- Ensure all "get" methods for Products, Sales, and History accept and enforce a `businessId` filter.
- Verify "save" methods include `businessId`.
- **[DONE]** Fix key generation bug (trailing spaces).
- **[DONE]** Add migration script for legacy keys.

#### [MODIFY] src/pages/Products.tsx, src/pages/Sales.tsx, etc.
- Pass the current `businessId` when fetching data.

#### [MODIFY] src/context/DataContext.tsx
- **[CRITICAL]** Fix `importBusiness` to prevent adding duplicate businesses (same ID) to state. Currently it blindly appends.

#### [MODIFY] src/components/auth/SyncConflictModal.tsx
- Change default resolution from 'MERGE' to 'KEEP_SEPARATE' (or no selection) to prevent accidental data merging.
- Improve UI to clearly distinguish between Local and Cloud businesses.

#### [MODIFY] src/context/AuthContext.tsx
- Ensure sync conflicts don't block the user unnecessarily.
- Verify `performSync` doesn't run in a loop if conflicts exist.

#### [MODIFY] src/context/DataContext.tsx
- Convert `products`, `sales`, `expenses` state to use **lazy initialization** from `localStorage`.
- **[NEW]** Refactor `useEffect` to ALWAYS load local data when `activeBusinessId` changes, not just when offline. This ensures instant data display while `loadCloudData` fetches in the background.

## Verification Plan
### Manual Verification
1.  Open Business A.
2.  Add a unique product.
3.  Switch to Business B.
4.  Verify the product is NOT visible.
5.  Repeat for Sales and History.
6.  **Sync Test:** Try to login/sync and ensure Business A and B remain separate if they have different IDs/names.
