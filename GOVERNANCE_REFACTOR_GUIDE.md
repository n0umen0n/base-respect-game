# Governance Contract Refactor Guide

## Overview

The RespectGameGovernance contract has been refactored to follow the DAOProposalsImplementation pattern, using a **single `createProposal` function** instead of separate functions for each proposal type.

## Key Changes

### Before (Old Design)

```solidity
// Separate functions for each proposal type
createBanProposal(address target, string description)
createApproveMemberProposal(address target, string description)
createExecuteTransactionsProposal(address[] targets, uint256[] values, bytes[] calldatas, string description)
```

### After (New Design)

```solidity
// Single unified function for all proposals
createProposal(address[] targets, uint256[] values, bytes[] calldatas, string description)

// Old functions kept for backwards compatibility (they call createProposal internally)
```

## How It Works

### 1. All Proposals Are Transactions

Every proposal type is now encoded as one or more transactions:

#### Ban Member Proposal

```javascript
targets = [coreContractAddress];
values = [0];
calldatas = [encodeFunctionData("banMemberByGovernance", [memberAddress])];
```

#### Approve Member Proposal

```javascript
targets = [coreContractAddress];
values = [0];
calldatas = [encodeFunctionData("approveMemberByGovernance", [memberAddress])];
```

#### Fund Transfer Proposal (ERC20)

```javascript
targets = [tokenAddress];
values = [0];
calldatas = [encodeFunctionData("transfer", [recipientAddress, amount])];
```

#### Fund Transfer Proposal (ETH)

```javascript
targets = [recipientAddress];
values = [amountInWei];
calldatas = ["0x"]; // empty calldata for ETH transfer
```

### 2. Automatic Type Detection

The contract automatically determines the proposal type by analyzing the first transaction:

```solidity
function _determineProposalType(address target, bytes calldata calldata_) private view returns (ProposalType) {
    if (target == coreContract && calldata_.length >= 4) {
        bytes4 selector = bytes4(calldata_[0:4]);

        // banMemberByGovernance(address) selector = 0x3c8463a1
        if (selector == 0x3c8463a1) return ProposalType.BanMember;

        // approveMemberByGovernance(address) selector = 0x9e75ab97
        if (selector == 0x9e75ab97) return ProposalType.ApproveMember;
    }

    // Everything else is ExecuteTransactions
    return ProposalType.ExecuteTransactions;
}
```

### 3. Enhanced Event with Transaction Data

The `ProposalCreated` event now includes full transaction data:

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    uint8 proposalType,
    address indexed proposer,
    address indexed targetMember,  // extracted from calldata if applicable
    address[] targets,              // NEW: All transaction targets
    uint256[] values,               // NEW: All transaction values
    bytes[] calldatas,              // NEW: All transaction calldatas
    string description,
    uint256 timestamp
);
```

## Frontend Integration

### Creating Proposals

Use the unified `createProposal` function for everything:

```typescript
// Ban Member
const banCalldata = encodeFunctionData({
  abi: RESPECT_GAME_CORE_ABI,
  functionName: "banMemberByGovernance",
  args: [memberAddress],
});

await governance.createProposal(
  [coreContractAddress],
  [0n],
  [banCalldata],
  "Ban this member for violation"
);

// Approve Member
const approveCalldata = encodeFunctionData({
  abi: RESPECT_GAME_CORE_ABI,
  functionName: "approveMemberByGovernance",
  args: [memberAddress],
});

await governance.createProposal(
  [coreContractAddress],
  [0n],
  [approveCalldata],
  "Approve this member"
);

// Transfer ERC20
const transferCalldata = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: "transfer",
  args: [recipientAddress, amount],
});

await governance.createProposal(
  [tokenAddress],
  [0n],
  [transferCalldata],
  "Transfer 1000 USDC to contributor"
);

// Transfer ETH
await governance.createProposal(
  [recipientAddress],
  [parseEther("1.0")],
  ["0x"],
  "Send 1 ETH to developer"
);
```

## Webhook Integration

The webhook needs to decode transaction data from the event to determine:

1. Proposal type (already in event)
2. Target member (for ban/approve proposals)
3. Transfer recipient and amount (for transfer proposals)

### Decoding Transaction Data

```typescript
// Function selectors
const SELECTORS = {
  banMemberByGovernance: "0x3c8463a1",
  approveMemberByGovernance: "0x9e75ab97",
  transfer: "0xa9059cbb",
};

async function handleProposalCreated(event: any) {
  const {
    proposalId,
    proposalType,
    proposer,
    targetMember,
    targets,
    values,
    calldatas,
    description,
    timestamp,
  } = event.args;

  let transfer_recipient = null;
  let transfer_amount = null;

  // If it's a transfer proposal, decode the transaction
  if (proposalType === 3) {
    // ExecuteTransactions
    const target = targets[0];
    const value = values[0];
    const calldata = calldatas[0];

    // Check if it's an ERC20 transfer
    if (calldata.startsWith(SELECTORS.transfer)) {
      // Decode transfer(address,uint256)
      const decoded = decodeFunctionData({
        abi: ERC20_ABI,
        data: calldata,
      });
      transfer_recipient = decoded.args[0];
      transfer_amount = decoded.args[1];
    }
    // Check if it's an ETH transfer
    else if (calldata === "0x" && value > 0n) {
      transfer_recipient = target;
      transfer_amount = value;
    }
  }

  // Store in database
  await supabase.from("proposals").insert({
    proposal_id: proposalId,
    proposal_type: getProposalTypeName(proposalType),
    proposer_address: proposer,
    target_member_address: targetMember !== "0x0000..." ? targetMember : null,
    transfer_recipient,
    transfer_amount: transfer_amount?.toString(),
    description,
    status: "Pending",
    votes_for: 0,
    votes_against: 0,
    tx_hash: event.transactionHash,
    block_timestamp: new Date(timestamp * 1000).toISOString(),
  });
}
```

## Database Schema

The existing schema already supports this (no changes needed):

```sql
CREATE TABLE proposals (
  proposal_id INTEGER UNIQUE NOT NULL,
  proposal_type VARCHAR(50) NOT NULL,  -- 'BanMember', 'ApproveMember', 'ExecuteTransactions'
  proposer_address VARCHAR(66) NOT NULL,
  target_member_address VARCHAR(66),    -- For ban/approve proposals
  transfer_amount BIGINT,               -- For transfer proposals
  transfer_recipient VARCHAR(66),       -- For transfer proposals
  description TEXT NOT NULL,
  ...
);
```

## Migration Steps

1. ✅ **Contract Updated** - New `createProposal` function added
2. ✅ **Interface Updated** - Event signature includes transaction data
3. ⏳ **Webhook Update** - Need to decode transaction data from events
4. ⏳ **Frontend Update** - Use new `createProposal` function
5. ⏳ **Deploy Contract** - Deploy updated governance contract

## Benefits

1. **Flexibility** - Any transaction can be proposed and executed
2. **Transparency** - All transaction data visible in events
3. **Simplicity** - One function to rule them all
4. **Backwards Compatible** - Old functions still work
5. **Consistent** - Same pattern as DAOProposalsImplementation
6. **Future-Proof** - Easy to add new proposal types without contract changes

## Testing

Test cases to cover:

- [ ] Create ban member proposal using new function
- [ ] Create approve member proposal using new function
- [ ] Create ERC20 transfer proposal
- [ ] Create ETH transfer proposal
- [ ] Create multi-transaction proposal
- [ ] Verify proposal type detection
- [ ] Verify target member extraction
- [ ] Verify transaction execution
- [ ] Verify backwards compatibility with old functions

## Function Selectors

For reference, these are the function selectors used:

```
banMemberByGovernance(address) = 0x3c8463a1
approveMemberByGovernance(address) = 0x9e75ab97
transfer(address,uint256) = 0xa9059cbb
```

You can compute these with:

```javascript
import { keccak256, toBytes } from "viem";
const selector = keccak256(toBytes("functionName(paramType)")).slice(0, 10);
```
