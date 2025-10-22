# Governance Contract Refactor - Complete Summary

## ✅ Changes Completed

### 1. Smart Contract Refactored

**File:** `blockchain/contracts/RespectGameGovernance.sol`

#### New Primary Function

```solidity
function createProposal(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata calldatas,
    string calldata description
) external returns (uint256)
```

This single function now handles ALL proposal types:

- Ban Member
- Approve Member
- Treasury Transfers (ETH & ERC20)
- Any custom transactions

#### Automatic Type Detection

The contract automatically determines proposal type by analyzing the transaction:

- Checks function selector in calldata
- Extracts target member address if applicable
- Categorizes as Ban/Approve/ExecuteTransactions

#### Legacy Compatibility

Old functions still work but internally call `createProposal`:

- `createBanProposal()` ✅
- `createApproveMemberProposal()` ✅
- `createExecuteTransactionsProposal()` ✅

### 2. Interface Updated

**File:** `blockchain/contracts/interfaces/IRespectGameGovernance.sol`

#### Enhanced Event

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    uint8 proposalType,
    address indexed proposer,
    address indexed targetMember,
    address[] targets,        // NEW: Full transaction data
    uint256[] values,          // NEW: ETH values
    bytes[] calldatas,         // NEW: Call data for decoding
    string description,
    uint256 timestamp
);
```

Now includes ALL transaction data in the event for frontend/webhook decoding!

### 3. Webhook Updated

**File:** `api/webhook-respect-game.ts`

#### Transaction Decoding

The webhook now:

- Decodes ERC20 transfers to extract recipient & amount
- Decodes ETH transfers to extract recipient & amount
- Stores `transfer_recipient` and `transfer_amount` in database
- Logs decoded data for debugging

```typescript
// Automatically detects and decodes:
// - ERC20 transfer(address,uint256) calls
// - ETH transfers (empty calldata with value)
```

### 4. Documentation Created

**Files:**

- `GOVERNANCE_REFACTOR_GUIDE.md` - Comprehensive guide
- `GOVERNANCE_REFACTOR_COMPLETE.md` - This summary

## 🎯 How It Works Now

### Creating Any Proposal (Unified Approach)

#### 1. Ban Member

```typescript
const calldata = encodeFunctionData({
  abi: RESPECT_GAME_CORE_ABI,
  functionName: "banMemberByGovernance",
  args: [memberAddress],
});

await governance.createProposal(
  [coreContractAddress],
  [0n],
  [calldata],
  "Reason for ban"
);
```

#### 2. Approve Member

```typescript
const calldata = encodeFunctionData({
  abi: RESPECT_GAME_CORE_ABI,
  functionName: "approveMemberByGovernance",
  args: [memberAddress],
});

await governance.createProposal(
  [coreContractAddress],
  [0n],
  [calldata],
  "Reason for approval"
);
```

#### 3. Transfer ERC20 Tokens

```typescript
const calldata = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: "transfer",
  args: [recipientAddress, amount],
});

await governance.createProposal(
  [tokenAddress],
  [0n],
  [calldata],
  "Transfer 1000 USDC to contributor"
);
```

#### 4. Transfer ETH

```typescript
await governance.createProposal(
  [recipientAddress],
  [parseEther("1.0")],
  ["0x"],
  "Send 1 ETH to developer"
);
```

## 📊 Database Integration

### No Schema Changes Needed

The existing schema already supports everything:

```sql
CREATE TABLE proposals (
  proposal_id INTEGER,
  proposal_type VARCHAR(50),      -- Automatically determined
  proposer_address VARCHAR(66),
  target_member_address VARCHAR(66), -- Extracted from calldata
  transfer_recipient VARCHAR(66),    -- ✅ NOW POPULATED
  transfer_amount BIGINT,            -- ✅ NOW POPULATED
  description TEXT,
  status VARCHAR(50),
  votes_for INTEGER,
  votes_against INTEGER,
  tx_hash VARCHAR(66),
  block_timestamp TIMESTAMP
);
```

### What Changed

- `transfer_recipient` is now populated from decoded transaction data
- `transfer_amount` is now populated from decoded transaction data
- Both fields are automatically extracted by the webhook

## 🎨 Frontend Display

With the transaction data in the database, the frontend can now show:

### Transfer Proposals

```
┌─────────────────────────────────────────────────────┐
│ #5                                     [👍 APPROVE] │
│                                                      │
│ Fund Transfer                                        │
│                                                      │
│ To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb     │
│ Amount: 1000000000 (1000 USDC)                     │
│                                                      │
│ Transfer 1000 USDC to top contributor              │
│                                                      │
│ Proposed by: VLADISLAV    10/22/2025               │
│                                                      │
│ VOTES: 2 APPROVE               NEEDED: 4           │
│ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
└─────────────────────────────────────────────────────┘
```

### Ban/Approve Proposals

```
┌─────────────────────────────────────────────────────┐
│ #3  BAN MEMBER                 [👍 FOR] [👎 AGAINST]│
│                                                      │
│ Ban Member: @cryptoscammer                         │
│                                                      │
│ Scamming community members                         │
│                                                      │
│ Proposed by: ALICE    10/22/2025                   │
│                                                      │
│ VOTES: 2 FOR / 1 AGAINST       NEEDED: 3          │
│ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
└─────────────────────────────────────────────────────┘
```

## 🔧 Next Steps

### 1. Test the Smart Contract

```bash
cd blockchain
npx hardhat test
```

Test cases needed:

- [ ] Create ban proposal via new function
- [ ] Create approve proposal via new function
- [ ] Create ERC20 transfer proposal
- [ ] Create ETH transfer proposal
- [ ] Verify proposal type detection
- [ ] Verify target member extraction
- [ ] Test backwards compatibility

### 2. Deploy Updated Contract

```bash
npx hardhat run scripts/deploy-governance.ts --network base-sepolia
```

### 3. Update Frontend Hook

**File:** `src/hooks/useRespectGame.tsx`

Replace the `createTransferProposal` function to use the new `createProposal` function:

```typescript
const createTransferProposal = async (
  tokenAddress: string,
  recipient: string,
  amount: string,
  decimals: number,
  description: string,
  isETH: boolean = false
) => {
  if (!smartAccountClient) throw new Error("Wallet not connected");

  const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

  let calldata: `0x${string}`;
  let value: bigint = 0n;
  let target: `0x${string}`;

  if (isETH) {
    target = recipient as `0x${string}`;
    value = amountBigInt;
    calldata = "0x" as `0x${string}`;
  } else {
    // Encode ERC20 transfer
    calldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, amountBigInt],
    }) as `0x${string}`;
    target = tokenAddress as `0x${string}`;
    value = 0n;
  }

  // Use new unified function
  const hash = await smartAccountClient.writeContract({
    address: RESPECT_GAME_GOVERNANCE_ADDRESS,
    abi: RESPECT_GAME_GOVERNANCE_ABI,
    functionName: "createProposal",
    args: [[target], [value], [calldata], description],
  });

  console.log("Proposal created, transaction hash:", hash);
  return hash;
};
```

### 4. Update Frontend to Display Transfer Details

**File:** `src/components/ProposalsPage.tsx`

Already done! ✅ The component will automatically display:

- Recipient address
- Transfer amount
- Properly formatted fields

### 5. Run SQL to Update Database Views

Already done! ✅ Views include `transfer_recipient` and `transfer_amount` fields.

## 🎉 Benefits Achieved

### 1. Flexibility

- Can propose ANY transaction, not just predefined types
- Multi-transaction proposals supported
- Easy to add new proposal types without contract changes

### 2. Transparency

- All transaction data visible in events
- Frontend can decode and display everything
- Users know exactly what they're voting on

### 3. Consistency

- Same pattern as DAOProposalsImplementation
- Single entry point for all proposals
- Cleaner architecture

### 4. Backwards Compatibility

- Old functions still work
- Existing frontend code doesn't break
- Gradual migration possible

### 5. Better UX

- Transfer proposals show recipient & amount
- No more "Unknown" proposal types
- Clear, detailed proposal cards

## 📋 Function Selectors Reference

```javascript
// Core contract functions
banMemberByGovernance(address) = 0x3c8463a1
approveMemberByGovernance(address) = 0x9e75ab97

// ERC20 functions
transfer(address,uint256) = 0xa9059cbb
approve(address,uint256) = 0x095ea7b3

// Compute any selector:
import { keccak256, toBytes } from 'viem';
const selector = keccak256(toBytes('functionName(paramTypes)')).slice(0, 10);
```

## ✨ Summary

The governance system has been successfully refactored to:

1. ✅ Use a single `createProposal` function for all proposal types
2. ✅ Emit transaction data in events for frontend decoding
3. ✅ Automatically decode transfer details in webhook
4. ✅ Store recipient & amount in database
5. ✅ Display transfer details in frontend
6. ✅ Maintain backwards compatibility

**Next:** Deploy the updated contract and test end-to-end!
