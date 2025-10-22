# Transfer Proposal Type Fix

## Problem

Transfer proposals were showing as "UNKNOWN" with green styling instead of blue "Fund Transfer Proposal" styling because:

1. The smart contract has 4 proposal types (0: BanMember, 1: ApproveMember, 2: TreasuryTransfer, **3: ExecuteTransactions**)
2. The webhook was only mapping types 0, 1, and 2
3. Transfer proposals use type 3, so they were getting stored as "Unknown" in the database

## Solution Applied

### 1. Fixed Webhook Mapping

**File:** `api/webhook-respect-game.ts`

Updated the proposal type mapping to include all 4 types:

```typescript
const proposalTypeMap: Record<number, string> = {
  0: "BanMember",
  1: "ApproveMember",
  2: "TreasuryTransfer",
  3: "ExecuteTransactions", // ← Added this
};
```

### 2. Updated Frontend

**File:** `src/components/ProposalsPage.tsx`

- Added support for both `TreasuryTransfer` and `ExecuteTransactions` types
- Both show as blue "Fund Transfer Proposal"
- Both hide the AGAINST button
- Both require 4 votes to pass

### 3. Created Database Fix Script

**File:** `supabase/fix-proposal-types.sql`

Run this script in your Supabase SQL Editor to fix existing proposals.

## How to Fix Existing Proposals

### Option 1: Run SQL Script in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open `supabase/fix-proposal-types.sql`
4. Run the script

### Option 2: Run SQL Directly

```sql
-- Update existing "Unknown" proposals to "ExecuteTransactions"
UPDATE proposals
SET proposal_type = 'ExecuteTransactions'
WHERE proposal_type = 'Unknown';
```

## Verification

After running the SQL fix:

1. Refresh your proposals page
2. Transfer proposals should now show:
   - ✅ Blue color scheme
   - ✅ "Fund Transfer Proposal" title
   - ✅ "FUND TRANSFER" label
   - ✅ Only FOR button (no AGAINST)
   - ✅ "NEEDED: 4" votes indicator

## Future Proposals

All new transfer proposals will automatically:

- Be correctly stored as "ExecuteTransactions" in the database (thanks to the webhook fix)
- Display with the proper blue styling
- Show only the FOR button
- Require 4 votes to pass

No code changes needed - everything is automatic!
