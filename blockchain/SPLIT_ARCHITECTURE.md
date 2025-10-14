# Split Architecture Documentation

## Overview

The Respect Game system has been split into two separate contracts to reduce contract size and improve maintainability:

1. **RespectGameCore** - Handles core game mechanics
2. **RespectGameGovernance** - Handles governance and proposals

This split reduces the contract size from **1329 lines** to:

- RespectGameCore: **~1031 lines**
- RespectGameGovernance: **~383 lines**

## Architecture Diagram

```
┌─────────────────┐
│  RespectToken   │
│   (ERC20)       │
└────────┬────────┘
         │ mints to
         │ winners
         ▼
┌─────────────────────────────────────────┐
│       RespectGameCore                   │
│  - Member registration                  │
│  - Contribution submission              │
│  - Ranking submission                   │
│  - Stage management                     │
│  - Group creation & shuffling           │
│  - RESPECT distribution                 │
│  - Top members calculation              │
└──────────────────┬──────────────────────┘
                   │
                   │ governance
                   │ contract ref
                   ▼
┌─────────────────────────────────────────┐
│    RespectGameGovernance                │
│  - Member approval proposals            │
│  - Member ban proposals                 │
│  - Execute transactions proposals       │
│  - Voting system                        │
│  - Proposal execution                   │
└──────────────────┬──────────────────────┘
                   │
                   │ controls
                   ▼
         ┌─────────────────┐
         │    Executor     │
         │ (Treasury ops)  │
         └─────────────────┘
```

## Contracts

### 1. RespectGameCore

**Purpose**: Manages the core game mechanics and RESPECT distribution.

**Key Functions**:

- `becomeMember()` - Join as a member
- `submitContribution()` - Submit contributions for current game
- `submitRanking()` - Submit rankings for your group
- `switchStage()` - Switch between contribution and ranking stages
- `approveMemberByGovernance()` - Approve a member (governance only)
- `banMemberByGovernance()` - Ban a member (governance only)
- `setGovernanceContract()` - Set governance contract address (owner only)

**View Functions**:

- `getMember()` - Get member information
- `getMyGroup()` - Get your group for a game
- `getContribution()` - Get contribution details
- `getGameResult()` - Get game result for a member
- `getTopMembers()` - Get top 6 members
- `isTopMember()` - Check if address is a top member
- Various getters for game state

**Storage**: Inherits from `RespectGameStorage` which contains all state variables.

### 2. RespectGameGovernance

**Purpose**: Manages proposals, voting, and governance actions.

**Key Functions**:

- `createBanProposal()` - Create proposal to ban a member (top members only)
- `createApproveMemberProposal()` - Create proposal to approve a member (top members only)
- `createExecuteTransactionsProposal()` - Create proposal to execute transactions (top members only)
- `voteOnProposal()` - Vote on a proposal (top members only)
- `executeProposal()` - Execute a proposal if threshold met
- `setExecutor()` - Set executor contract (owner only)

**View Functions**:

- `getProposal()` - Get proposal details
- `getProposalTransactionCount()` - Get transaction count
- `getProposalTransaction()` - Get specific transaction details
- `getProposalCount()` - Get total proposals

**Storage**: Also inherits from `RespectGameStorage` for proposal data.

**Voting Thresholds**:

- Approve Member: 2 votes
- Ban Member: 3 votes
- Execute Transactions: 4 votes

## Interfaces

### IRespectGameCore

Defines all functions available in the core contract.

### IRespectGameGovernance

Defines all functions available in the governance contract.

## Deployment

### Using the deployment script:

```bash
npx hardhat run scripts/respect-game-split.deploy.ts --network <network>
```

### Deployment Steps:

1. Deploy RespectToken
2. Deploy Executor
3. Deploy RespectGameCore
4. Deploy RespectGameGovernance
5. Add RespectGameCore as minter on RespectToken
6. Set governance contract in core
7. Set governance as proposal manager in executor

### Manual Deployment:

```typescript
// 1. Deploy RespectToken
const respectToken = await upgrades.deployProxy(RespectToken, [
  owner.address,
  "RESPECT",
  "RESPECT",
]);

// 2. Deploy Executor (with temporary proposal manager)
const executor = await Executor.deploy(deployer.address);

// 3. Deploy RespectGameCore
const respectGameCore = await upgrades.deployProxy(RespectGameCore, [
  owner.address,
  respectTokenAddress,
  treasury,
  membersWithoutApproval,
  periodsForAverage,
  respectDistribution,
  contributionSubmissionLength,
  contributionRankingLength,
]);

// 4. Deploy RespectGameGovernance
const respectGameGovernance = await upgrades.deployProxy(
  RespectGameGovernance,
  [owner.address, respectGameCoreAddress, executorAddress]
);

// 5. Configure permissions
await respectToken.addMinter(respectGameCoreAddress);
await respectGameCore.setGovernanceContract(respectGameGovernanceAddress);
await executor.setProposalManager(respectGameGovernanceAddress);
// Note: Executor ownership stays with deployer for admin purposes
```

## Testing

Run tests with:

```bash
npx hardhat test test/RespectGameSplit.test.ts
```

The test file includes:

- Deployment tests
- Member registration tests
- Contribution submission tests
- Stage management tests
- Governance tests (approval and ban)
- Full game cycle test

## Migration from Original Contract

If you have an existing RespectGameImplementation deployment:

1. **Cannot directly upgrade**: The split requires two separate contracts, so a direct upgrade is not possible.

2. **Migration steps**:

   - Deploy new split architecture contracts
   - Pause old contract (if pause functionality exists)
   - Migrate member data to new core contract
   - Transfer RESPECT token minting rights
   - Update frontend to use new contract addresses

3. **Considerations**:
   - Active games in progress will need to complete on the old contract
   - Member RESPECT balances are in the token contract (no migration needed)
   - Historical game data will need to be migrated if required

## Benefits of Split Architecture

1. **Reduced Contract Size**: Each contract is well below the 24KB limit
2. **Separation of Concerns**: Core game logic separate from governance
3. **Easier Upgrades**: Can upgrade core or governance independently
4. **Better Gas Optimization**: Smaller contracts can be more efficient
5. **Improved Maintainability**: Easier to understand and modify
6. **Modular Design**: Governance can be swapped or upgraded without affecting core game

## Security Considerations

1. **Governance-Only Functions**: Core contract has `onlyGovernance` modifier for sensitive functions
2. **Owner Control**: Both contracts have owner who can upgrade
3. **Executor Ownership**: Executor is owned by governance, not core
4. **Top Member Checks**: Governance validates top member status through core contract
5. **Storage Layout**: Both contracts inherit same storage to maintain upgrade compatibility

## Frontend Integration

When integrating with the split architecture:

```javascript
// Connect to both contracts
const core = new ethers.Contract(coreAddress, coreABI, signer);
const governance = new ethers.Contract(govAddress, govABI, signer);

// Core game actions
await core.becomeMember(name, profileUrl, description, xAccount);
await core.submitContribution(contributions, links);
await core.submitRanking(rankedAddresses);

// Governance actions (top members only)
const proposalId = await governance.createApproveMemberProposal(
  memberAddress,
  "reason"
);
await governance.voteOnProposal(proposalId, true);

// View functions work from either contract
const topMembers = await core.getTopMembers();
const proposal = await governance.getProposal(proposalId);
```

## Future Enhancements

Possible improvements to the split architecture:

1. **Separate Storage Contract**: Extract storage into its own contract for even better upgradeability
2. **Multiple Governance Modules**: Support different governance systems
3. **Plugin System**: Allow adding new game features without upgrading core
4. **Event Aggregator**: Centralized event system for easier frontend integration
5. **Gas Optimization**: Further optimize frequently-called functions

## Support

For questions or issues with the split architecture:

1. Review this documentation
2. Check the test file for usage examples
3. Review the deployment script for setup examples
4. Consult the original RESPECT_GAME_README.md for game mechanics
