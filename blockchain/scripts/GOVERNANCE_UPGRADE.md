# Governance Contract Upgrade Guide

## Step 1: Find Your Governance Proxy Address

Run the helper script to find your deployed governance proxy address:

```bash
npx hardhat run scripts/find-governance-address.ts --network base-mainnet
```

This will search for your governance proxy address in:

- `.openzeppelin/` directory
- `deployments.json`
- `src/config/contracts.config.ts`

## Step 2: Update the Upgrade Script

Edit `scripts/governance.manual-upgrade.ts` and update line 4:

```typescript
const GOVERNANCE_PROXY_ADDRESS = "0xYourActualGovernanceProxyAddress";
```

Replace with the address you found in Step 1.

## Step 3: Run the Upgrade

Execute the upgrade script:

```bash
npx hardhat run scripts/governance.manual-upgrade.ts --network base-mainnet
```

The script will:

1. ✅ Get current implementation address
2. ✅ Check current state (proposal count, executor, etc.)
3. ✅ Deploy new implementation with `createProposal` function
4. ✅ Upgrade the proxy to point to new implementation
5. ✅ Verify state is preserved
6. ✅ Check new functions are available
7. ✅ Verify legacy functions still work

## Step 4: Verify the Upgrade

The script will automatically verify:

- Implementation address changed
- State preserved (proposals, executor, etc.)
- New `createProposal` function available
- Legacy functions (`createBanProposal`, etc.) still work
- Transaction storage working

## Step 5: Update Frontend

After successful upgrade:

1. **Copy new ABI to frontend:**

   ```bash
   cp artifacts/contracts/RespectGameGovernance.sol/RespectGameGovernance.json ../src/contracts/
   ```

2. **Update the ABI in your code** (if you import it directly)

3. **Redeploy your application**

## Step 6: Update Webhook

Redeploy your webhook with the updated event handling:

```bash
vercel --prod
```

## What Changed

### New Function

```solidity
function createProposal(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata calldatas,
    string calldata description
) external returns (uint256)
```

### Enhanced Event

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    uint8 proposalType,
    address indexed proposer,
    address indexed targetMember,
    address[] targets,      // NEW
    uint256[] values,        // NEW
    bytes[] calldatas,       // NEW
    string description,
    uint256 timestamp
);
```

### Backwards Compatibility

All old functions still work:

- `createBanProposal()`
- `createApproveMemberProposal()`
- `createExecuteTransactionsProposal()`

They internally call the new `createProposal` function.

## Testing

After upgrade, test:

1. Create a proposal using the new function
2. Create a proposal using old functions (should still work)
3. Vote on proposals
4. Execute proposals
5. Check that events include transaction data

## Troubleshooting

### "Proxy is not registered"

The script will automatically import the proxy if needed.

### "Implementation address did not change"

Check if the contract actually has changes that need deploying.

### State not preserved

This should not happen with UUPS upgrades, but the script verifies this.

## Rollback

If you need to rollback:

1. You cannot directly rollback UUPS proxies
2. You would need to deploy the old implementation again
3. And upgrade to it (treating it as a "new" version)

Better approach: Test thoroughly on testnet first!

## Network-Specific Commands

### Base Mainnet

```bash
npx hardhat run scripts/governance.manual-upgrade.ts --network base-mainnet
```

### Base Sepolia (Testnet)

```bash
npx hardhat run scripts/governance.manual-upgrade.ts --network base-sepolia
```

## Support

If you encounter issues:

1. Check the script output for detailed error messages
2. Verify your governance proxy address is correct
3. Ensure you have enough ETH/gas for the upgrade
4. Check that you're the owner of the proxy contract
