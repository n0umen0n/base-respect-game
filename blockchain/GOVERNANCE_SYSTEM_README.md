# RespectGame Governance System

## Overview

The RespectGame contract now includes a robust governance system similar to DAO proposals, allowing the top 6 members (by average RESPECT) to govern the treasury and execute arbitrary functions through a proposal-voting mechanism.

## Key Features

### 1. **Executor Contract**

- The treasury is now managed by an `Executor` contract (similar to a Gnosis Safe or multi-sig wallet)
- The Executor holds the treasury funds and can only execute transactions approved by governance
- The Executor can be funded with ETH or any tokens

### 2. **Proposal Types**

The system now supports multiple proposal types:

- **BanMember**: Ban a member from the game
- **ApproveMember**: Approve a pending member
- **ExecuteTransactions**: Execute arbitrary transactions through the Executor

### 3. **Transaction Proposals**

Top 6 members can create proposals to execute any function call(s):

- Send ETH from the treasury
- Call functions on other contracts
- Batch multiple transactions in a single proposal
- Interact with DeFi protocols, NFTs, etc.

### 4. **Voting Mechanism**

- **Who can vote**: Only the top 6 members (by average RESPECT) can create and vote on proposals
- **Thresholds**: Vary by proposal type (see below)
- **Auto-execution**: Proposals automatically execute when threshold is reached
- **One vote per member**: Each member can only vote once per proposal

### 5. **Voting Thresholds**

Different proposal types require different vote counts:

- **Approve Member**: **2 out of 6 votes** (33% - easy to onboard)
- **Ban Member**: **3 out of 6 votes** (50% - moderate consensus)
- **Execute Transactions**: **4 out of 6 votes** (67% - strong consensus for treasury)

## Architecture

```
┌─────────────────────────────────────────┐
│      RespectGame Contract               │
│  (Governance Logic + Game Logic)        │
│                                          │
│  - Top 6 Members can create proposals   │
│  - 4 out of 6 votes to execute          │
│  - Manages member approval/banning      │
└────────────┬────────────────────────────┘
             │
             │ executeTransactions()
             │
             ▼
┌─────────────────────────────────────────┐
│        Executor Contract                │
│  (Treasury / Transaction Executor)      │
│                                          │
│  - Holds ETH and tokens                 │
│  - Only executes approved proposals     │
│  - Can interact with any contract       │
└─────────────────────────────────────────┘
```

## Deployment

### 1. Deploy the Executor

```bash
# Set your RespectGame proxy address
export RESPECT_GAME_PROXY_ADDRESS=0x...

# Deploy the executor and link it to RespectGame
npx hardhat run scripts/respect-game-executor.deploy.ts --network <network>
```

### 2. Fund the Executor (Treasury)

```bash
# Send ETH to the executor address
# Or send tokens using any standard transfer method
```

## Usage Examples

### Example 1: Send ETH from Treasury

```typescript
// Top member creates a proposal to send 1 ETH
const targets = [recipientAddress];
const values = [ethers.parseEther("1")];
const calldatas = ["0x"];

await respectGame.createExecuteTransactionsProposal(
  targets,
  values,
  calldatas,
  "Send 1 ETH to contributor"
);

// 4 top members vote yes
await respectGame.voteOnProposal(proposalId, true);
// Automatically executes when 4th vote is cast
```

### Example 2: Interact with DeFi Protocol

```typescript
// Approve USDC for Uniswap
const usdcAddress = "0x...";
const uniswapRouter = "0x...";
const amount = ethers.parseUnits("1000", 6); // 1000 USDC

const approveCalldata = IERC20.encodeFunctionData("approve", [
  uniswapRouter,
  amount,
]);

const targets = [usdcAddress];
const values = [0];
const calldatas = [approveCalldata];

await respectGame.createExecuteTransactionsProposal(
  targets,
  values,
  calldatas,
  "Approve USDC for Uniswap"
);
```

### Example 3: Batch Multiple Transactions

```typescript
// Send ETH to multiple contributors in one proposal
const targets = [contributor1, contributor2, contributor3];
const values = [
  ethers.parseEther("0.5"),
  ethers.parseEther("0.3"),
  ethers.parseEther("0.2"),
];
const calldatas = ["0x", "0x", "0x"];

await respectGame.createExecuteTransactionsProposal(
  targets,
  values,
  calldatas,
  "Monthly contributor rewards"
);
```

### Example 4: Call Contract Functions

```typescript
// Mint NFTs from the treasury
const nftContract = "0x...";
const mintCalldata = NFTContract.encodeFunctionData("mint", [
  recipientAddress,
  tokenId,
]);

const targets = [nftContract];
const values = [ethers.parseEther("0.1")]; // Mint fee
const calldatas = [mintCalldata];

await respectGame.createExecuteTransactionsProposal(
  targets,
  values,
  calldatas,
  "Mint NFT for top contributor"
);
```

## Smart Contract Functions

### Creating Proposals

```solidity
// Create a transaction proposal (only top 6)
function createExecuteTransactionsProposal(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata calldatas,
    string calldata description
) external returns (uint256 proposalId);

// Create a ban proposal (only top 6)
function createBanProposal(
    address targetMember,
    string calldata description
) external returns (uint256 proposalId);

// Create an approve member proposal (only top 6)
function createApproveMemberProposal(
    address targetMember,
    string calldata description
) external returns (uint256 proposalId);
```

### Voting

```solidity
// Vote on a proposal (only top 6)
function voteOnProposal(
    uint256 proposalId,
    bool voteFor
) external;
```

### View Functions

```solidity
// Get proposal details (without transactions)
function getProposal(uint256 proposalId)
    external view returns (
        uint8 proposalType,
        address proposer,
        address targetMember,
        uint256 transferAmount,
        address transferRecipient,
        string memory description,
        uint256 createdAt,
        uint8 status,
        uint256 votesFor,
        uint256 votesAgainst
    );

// Get number of transactions in a proposal
function getProposalTransactionCount(uint256 proposalId)
    external view returns (uint256);

// Get a specific transaction from a proposal
function getProposalTransaction(uint256 proposalId, uint256 txIndex)
    external view returns (
        address target,
        uint256 value,
        bytes memory data
    );

// Check if address is in top 6
function isTopMember(address member)
    external view returns (bool);
```

## Events

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    uint8 proposalType,
    address indexed proposer,
    address indexed targetMember,
    string description,
    uint256 timestamp
);

event ProposalVoted(
    uint256 indexed proposalId,
    address indexed voter,
    bool voteFor,
    uint256 totalVotesFor,
    uint256 totalVotesAgainst
);

event ProposalExecuted(
    uint256 indexed proposalId,
    uint8 proposalType,
    uint256 timestamp
);

event ExecutorSet(
    address indexed executor,
    uint256 timestamp
);

event TransactionsExecuted(
    uint256 indexed proposalId,
    uint256 transactionCount,
    uint256 timestamp
);
```

## Security Considerations

1. **Top 6 Stability**: The top 6 members can change based on average RESPECT, so the voting power is dynamic
2. **Treasury Access**: Only approved proposals (4/6 votes) can access treasury funds
3. **Execution Safety**: All transactions go through the Executor, which validates the caller
4. **Upgrade Safety**: The storage layout maintains compatibility with existing deployments

## Testing

Run the governance tests:

```bash
npx hardhat test test/RespectGameGovernance.test.ts
```

The test suite covers:

- Executor setup and funding
- Proposal creation by top members
- Voting thresholds (4 out of 6)
- Transaction execution
- Multi-transaction proposals
- Contract interactions
- Updated ban/approve thresholds

## Migration from Old System

If you have an existing RespectGame deployment:

1. **Deploy Executor**: Use the deployment script
2. **Set Executor**: Call `setExecutor()` as owner
3. **Fund Treasury**: Transfer funds to the Executor address
4. **Update Frontend**: Add UI for transaction proposals
5. **Educate Top Members**: Inform them about the new 4/6 voting threshold

## Future Enhancements

Potential improvements to consider:

- Time-based voting periods (proposals expire after N days)
- Veto power or emergency mechanisms
- Proposal templates for common actions
- Integration with treasury management tools
- Delegation of voting power
- Snapshot-based voting to prevent vote manipulation

## Support

For questions or issues:

- Review the test suite for usage examples
- Check the inline code documentation
- Consult the DAOProposals implementation for advanced patterns
