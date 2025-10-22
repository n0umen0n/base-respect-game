# Transfer Proposal UI Update

## Changes Made

### 1. Database Views Updated

**File:** `supabase/update-proposal-views.sql`

Added `transfer_amount` and `transfer_recipient` fields to both `live_proposals` and `historical_proposals` views so we can display transfer details.

**Run this SQL in your Supabase Dashboard:**

```sql
-- See supabase/update-proposal-views.sql
```

### 2. TypeScript Interface Updated

**File:** `src/lib/supabase-respect.ts`

Added optional fields to `LiveProposal` interface:

- `transfer_amount?: number`
- `transfer_recipient?: string`

### 3. Proposal Card UI Changes

**File:** `src/components/ProposalsPage.tsx`

#### Removed:

- ❌ "FUND TRANSFER" chip label (removed from card header)
- ❌ "/ 0 AGAINST" text from votes display

#### Changed:

- 📝 Title changed from "Fund Transfer Proposal" to "Fund Transfer"
- 🔘 Button text changed from "FOR" to "APPROVE" for transfer proposals
- 💬 Dialog text changed to "approve" for transfer proposals

#### Added:

- ✅ **Recipient address** display (To: 0x...)
- ✅ **Transfer amount** display (Amount: XXX)
- ✅ Clean monospace formatting for transfer details

## What You Need to Do

### Step 1: Update Database Views

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
CREATE OR REPLACE VIEW live_proposals AS
SELECT
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
  p.transfer_amount,
  p.transfer_recipient,
  p.description,
  p.status,
  p.votes_for,
  p.votes_against,
  p.block_timestamp,
  p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status = 'Pending'
ORDER BY p.created_at DESC;

CREATE OR REPLACE VIEW historical_proposals AS
SELECT
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
  p.transfer_amount,
  p.transfer_recipient,
  p.description,
  p.status,
  p.votes_for,
  p.votes_against,
  p.block_timestamp,
  p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status != 'Pending'
ORDER BY p.created_at DESC;
```

### Step 2: Refresh Your App

After running the SQL, refresh your proposals page. The transfer proposals should now show:

## New Transfer Proposal Card Design

```
┌─────────────────────────────────────────────────────┐
│ #1                                     [👍 APPROVE] │
│                                                      │
│ Fund Transfer                                        │
│                                                      │
│ To: 0x1234...5678                                   │
│ Amount: 1000 USDC                                   │
│                                                      │
│ Description text here...                            │
│                                                      │
│ Proposed by: VLADISLAV    10/22/2025               │
│                                                      │
│ VOTES: 0 APPROVE               NEEDED: 4           │
│ [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
└─────────────────────────────────────────────────────┘
```

## Key Improvements

1. **Cleaner Header** - No redundant "FUND TRANSFER" label
2. **Shorter Title** - "Fund Transfer" instead of "Fund Transfer Proposal"
3. **Transfer Details** - Shows recipient and amount prominently
4. **Better Semantics** - "APPROVE" button is more appropriate than "FOR"
5. **Cleaner Vote Display** - No confusing "/ 0 AGAINST" text
6. **Professional Look** - Monospace font for addresses/amounts

## Notes

- The transfer details (recipient and amount) will only display if they exist in the database
- All existing functionality remains the same - only the UI has been improved
- The webhook should populate `transfer_recipient` and `transfer_amount` when creating transfer proposals
