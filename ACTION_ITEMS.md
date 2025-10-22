# Action Items - Governance Refactor

## ✅ Completed

- [x] Refactored RespectGameGovernance contract with single `createProposal` function
- [x] Updated interface with enhanced event signature
- [x] Updated webhook to decode transaction data
- [x] Automatic extraction of transfer recipient & amount
- [x] Documentation created

## 🔧 To Do

### 1. Test Smart Contract Changes

```bash
cd blockchain
npx hardhat compile
npx hardhat test
```

### 2. Deploy Updated Governance Contract

```bash
cd blockchain
npx hardhat run scripts/deploy-governance.ts --network base-sepolia
# or
npx hardhat run scripts/upgrade-governance.ts --network base-sepolia
```

### 3. Update Frontend `useRespectGame` Hook

**File:** `src/hooks/useRespectGame.tsx`

Find the `createTransferProposal` function and update it to use `createProposal`:

```typescript
// Change from:
functionName: 'createExecuteTransactionsProposal',
args: [[target], [value], [calldata], description],

// To:
functionName: 'createProposal',
args: [[target], [value], [calldata], description],
```

### 4. Update Contract ABI

After deployment, update the ABI in your frontend:

```bash
# Copy new ABI from blockchain/artifacts
cp blockchain/artifacts/contracts/RespectGameGovernance.sol/RespectGameGovernance.json src/contracts/
```

### 5. Update Alchemy Webhook

If webhook is already deployed, redeploy it with the updated event signature:

```bash
vercel --prod
# or however you deploy your webhook
```

### 6. Test End-to-End

1. Create a transfer proposal from frontend
2. Check webhook logs for decoded data
3. Verify database has `transfer_recipient` and `transfer_amount`
4. Verify frontend displays transfer details correctly
5. Vote on proposal
6. Execute proposal

### 7. Update SQL Views (if not done)

Run in Supabase SQL Editor:

```sql
-- File: supabase/update-proposal-views.sql
CREATE OR REPLACE VIEW live_proposals AS
SELECT
  p.proposal_id, p.proposal_type, p.proposer_address,
  m.name as proposer_name, p.target_member_address,
  tm.name as target_member_name,
  p.transfer_amount, p.transfer_recipient,
  p.description, p.status, p.votes_for, p.votes_against,
  p.block_timestamp, p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status = 'Pending'
ORDER BY p.created_at DESC;
```

### 8. Fix Existing "Unknown" Proposals

Run in Supabase SQL Editor:

```sql
-- File: supabase/fix-proposal-types.sql
UPDATE proposals
SET proposal_type = 'ExecuteTransactions'
WHERE proposal_type = 'Unknown';
```

## 📝 Quick Test Checklist

- [ ] Contract compiles without errors
- [ ] Contract tests pass
- [ ] Contract deployed successfully
- [ ] Frontend can create proposals
- [ ] Webhook receives and decodes events
- [ ] Database stores transfer details
- [ ] Frontend displays transfer details
- [ ] Proposals can be voted on
- [ ] Proposals execute correctly

## 🚨 Important Notes

1. **Backwards Compatible**: Old `createBanProposal`, `createApproveMemberProposal`, and `createExecuteTransactionsProposal` functions still work!

2. **No Breaking Changes**: Existing frontend code will continue to work. You can migrate gradually.

3. **ABI Update Required**: After deploying the new contract, you MUST update the ABI in your frontend.

4. **Webhook Update**: The webhook needs to be redeployed to handle the new event structure.

5. **Database Ready**: No database migrations needed - schema already supports all fields!

## 📚 Reference Files

- `GOVERNANCE_REFACTOR_GUIDE.md` - Detailed technical guide
- `GOVERNANCE_REFACTOR_COMPLETE.md` - Complete summary of changes
- `blockchain/contracts/RespectGameGovernance.sol` - Updated contract
- `api/webhook-respect-game.ts` - Updated webhook

## Need Help?

Check the documentation files for:

- How to create proposals using the new function
- How transaction data is decoded
- Function selector reference
- Example code snippets
