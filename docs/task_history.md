# Bug Fixes - Profit Tracker App

## Pending
- [x] Investigate data isolation bug (Products/Sales/History leaking between businesses)
    - [x] Analyze `src/services` for offline storage logic
    - [x] Check `src/pages` for data fetching implementation
    - [x] Verify `businessId` usage in data queries
- [x] Investigate "ghost merge" and bad sync modal
    - [x] Locate `setPendingConsolidation` trigger
    - [x] Audit `loadCloudData` for implicit merges
    - [/] Verify `SyncConflictModal` behavior in `AuthContext`
- [x] Fix offline data separation (ensure no cross-contamination)
    - [x] Fix `importBusiness` duplicate bug in `DataContext.tsx`
    - [x] Update `SyncConflictModal` defaults to 'KEEP_SEPARATE'
    - [x] Optimize `AuthContext` sync loop
- [x] Remove 'Top Products' section from Dashboard
    - [x] Locate and remove code in `Dashboard.tsx`
- [x] Fix Wake-up Data Leak / Business Switch
    - [x] `loadCloudData`: Merge local (unsynced) businesses with cloud fetch instead of overwriting
    - [x] `checkMembershipAndSync`: Prevent auto-logout on network error/partial fetch
- [x] Optimize App Startup Speed (Fix 60s Delay)
    - [x] Implement lazy initialization for `products`, `sales`, `expenses` in `DataContext`
    - [x] Implement Stale-While-Revalidate pattern: Always load local data on `activeBusinessId` change
- [x] Implement fix for Product isolation (Verified via DataContext)
- [x] Implement fix for Sales isolation (Verified via DataContext)
- [x] Implement fix for History isolation (Verified via DataContext)

