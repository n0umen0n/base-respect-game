# RespectGame Scripts Guide

This directory contains scripts for deploying and interacting with the RespectGame smart contracts.

## Deployment Script

### `respect-game.deploy.ts`

Deploys the complete RespectGame system including RespectToken and RespectGame contracts.

**Usage:**

```bash
# Local network
npx hardhat run scripts/respect-game.deploy.ts --network localhost

# Base Sepolia (testnet)
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia

# Base Mainnet
npx hardhat run scripts/respect-game.deploy.ts --network base-mainnet
```

**What it does:**

1. Deploys RespectToken (ERC-20)
2. Deploys RespectGame (main game logic)
3. Configures RespectGame as token minter
4. Outputs deployment addresses and configuration

**Configuration:**

You can modify these parameters in the script:

```typescript
const membersWithoutApproval = 10; // First N members auto-approved
const periodsForAverage = 12; // Weeks for average calculation
const respectDistribution = [210000, 130000, 80000, 50000, 30000]; // Rank rewards
const contributionSubmissionLength = 10 * 60; // 10 minutes (change for production)
const contributionRankingLength = 10 * 60; // 10 minutes (change for production)
```

**Production Settings:**

For production deployment, update the time periods:

```typescript
const contributionSubmissionLength = 6 * 24 * 60 * 60; // 6 days
const contributionRankingLength = 1 * 24 * 60 * 60; // 1 day
```

## Interaction Scripts

Below are example scripts you can create for common operations:

### Become a Member

Create `scripts/become-member.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const tx = await respectGame.becomeMember(
    "Your Name",
    "https://your-profile.com",
    "Your description",
    "@yourXaccount"
  );
  await tx.wait();

  console.log("Successfully joined as member!");
}

main().catch(console.error);
```

### Submit Contribution

Create `scripts/submit-contribution.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const contributions = [
    "Built a new feature for Base",
    "Fixed critical bug in protocol",
    "Wrote documentation",
  ];

  const links = [
    "https://github.com/base/repo/pr/123",
    "https://github.com/base/repo/pr/124",
    "https://docs.base.org/new-doc",
  ];

  const tx = await respectGame.submitContribution(contributions, links);
  await tx.wait();

  console.log("Contribution submitted!");
}

main().catch(console.error);
```

### Get Your Group

Create `scripts/get-my-group.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const gameNumber = await respectGame.currentGameNumber();
  const [group, groupId] = await respectGame.getMyGroup(gameNumber);

  console.log("Game Number:", gameNumber.toString());
  console.log("Group ID:", groupId.toString());
  console.log("Group Members:");
  group.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member}`);
  });
}

main().catch(console.error);
```

### Submit Ranking

Create `scripts/submit-ranking.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  // Get your group first
  const gameNumber = await respectGame.currentGameNumber();
  const [group, groupId] = await respectGame.getMyGroup(gameNumber);

  console.log("Your group members:");
  group.forEach((member, index) => {
    console.log(`  ${index + 1}. ${member}`);
  });

  // Rank them (edit this array with your rankings)
  const rankings = [
    group[0], // 1st place
    group[1], // 2nd place
    group[2], // 3rd place
    group[3], // 4th place
    group[4], // 5th place
  ];

  const tx = await respectGame.submitRanking(rankings);
  await tx.wait();

  console.log("Rankings submitted!");
}

main().catch(console.error);
```

### Switch Stage

Create `scripts/switch-stage.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const currentStage = await respectGame.getCurrentStage();
  const nextStageTime = await respectGame.getNextStageTimestamp();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log("Current stage:", currentStage === 0n ? "Submission" : "Ranking");
  console.log(
    "Next stage time:",
    new Date(Number(nextStageTime) * 1000).toLocaleString()
  );
  console.log("Current time:", new Date(currentTime * 1000).toLocaleString());

  if (currentTime < nextStageTime) {
    console.log("Too early to switch stage!");
    console.log(`Wait ${Number(nextStageTime) - currentTime} seconds`);
    return;
  }

  console.log("Switching stage...");
  const tx = await respectGame.switchStage();
  await tx.wait();

  const newStage = await respectGame.getCurrentStage();
  console.log("New stage:", newStage === 0n ? "Submission" : "Ranking");

  // May need to call multiple times for batch processing
  console.log("Check if processing complete and call again if needed");
}

main().catch(console.error);
```

### View Member Info

Create `scripts/view-member.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const memberAddress = "MEMBER_ADDRESS_TO_VIEW";

  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const member = await respectGame.getMember(memberAddress);

  console.log("Member Information:");
  console.log("==================");
  console.log("Address:", member.wallet);
  console.log("Name:", member.name);
  console.log("Profile:", member.profileUrl);
  console.log("Description:", member.description);
  console.log("X Account:", member.xAccount);
  console.log("Approved:", member.isApproved);
  console.log("Banned:", member.isBanned);
  console.log("Total RESPECT Earned:", member.totalRespectEarned.toString());
  console.log("Average RESPECT:", member.averageRespect.toString());
}

main().catch(console.error);
```

### Create Proposal (Top 6 Only)

Create `scripts/create-proposal.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const [signer] = await ethers.getSigners();

  // Check if you're a top member
  const isTop = await respectGame.isTopMember(signer.address);
  if (!isTop) {
    console.log("You are not a top 6 member!");
    return;
  }

  // Example: Ban member
  const targetMember = "MEMBER_TO_BAN_ADDRESS";
  const tx = await respectGame.createBanProposal(
    targetMember,
    "Spam and violation of community guidelines"
  );
  const receipt = await tx.wait();

  console.log("Ban proposal created!");
  console.log("Transaction hash:", receipt.hash);
}

main().catch(console.error);
```

### Vote on Proposal (Top 6 Only)

Create `scripts/vote-proposal.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const proposalId = 0; // Change to your proposal ID
  const voteFor = true; // true to vote for, false to vote against

  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const [signer] = await ethers.getSigners();

  // Check if you're a top member
  const isTop = await respectGame.isTopMember(signer.address);
  if (!isTop) {
    console.log("You are not a top 6 member!");
    return;
  }

  const tx = await respectGame.voteOnProposal(proposalId, voteFor);
  await tx.wait();

  console.log(`Voted ${voteFor ? "FOR" : "AGAINST"} proposal ${proposalId}`);
}

main().catch(console.error);
```

### View Game Stats

Create `scripts/view-stats.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const respectGameAddress = "YOUR_RESPECT_GAME_ADDRESS";
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    respectGameAddress
  );

  const gameNumber = await respectGame.currentGameNumber();
  const stage = await respectGame.getCurrentStage();
  const nextStageTime = await respectGame.getNextStageTimestamp();
  const memberCount = await respectGame.getMemberCount();
  const approvedCount = await respectGame.getApprovedMemberCount();
  const topMembers = await respectGame.getTopMembers();

  console.log("RespectGame Statistics");
  console.log("======================");
  console.log("Current Game:", gameNumber.toString());
  console.log(
    "Current Stage:",
    stage === 0n ? "Contribution Submission" : "Contribution Ranking"
  );
  console.log(
    "Next Stage:",
    new Date(Number(nextStageTime) * 1000).toLocaleString()
  );
  console.log("Total Members:", memberCount.toString());
  console.log("Approved Members:", approvedCount.toString());
  console.log("\nTop 6 Members:");

  for (let i = 0; i < 6; i++) {
    if (topMembers[i] !== ethers.ZeroAddress) {
      const member = await respectGame.getMember(topMembers[i]);
      console.log(
        `  ${i + 1}. ${member.name} (${topMembers[i]}) - Avg: ${
          member.averageRespect
        }`
      );
    }
  }
}

main().catch(console.error);
```

## Running Scripts

Execute any script with:

```bash
npx hardhat run scripts/SCRIPT_NAME.ts --network NETWORK_NAME
```

Example:

```bash
npx hardhat run scripts/view-stats.ts --network base-sepolia
```

## Environment Setup

Make sure your `.env` file has:

```env
PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

## Tips

1. **Check Stage Before Action**: Always verify the current stage before submitting contributions or rankings
2. **Batch Processing**: `switchStage()` may need multiple calls if there are many members
3. **Gas Estimation**: Test on testnet first to estimate gas costs
4. **Event Listening**: Monitor events for real-time updates
5. **Time Buffers**: Allow time buffers before stage transitions in production

## Common Issues

### "Too early to switch stage"

- Wait for `nextStageTimestamp` to pass
- Check with `view-stats.ts`

### "Not an approved member"

- First 10 members are auto-approved
- Others need proposal approval from top 6

### "Not in this group"

- Groups are assigned after switching to ranking stage
- Use `get-my-group.ts` to see your group

### "Already submitted"

- Can only submit one contribution per game
- Can only submit one ranking per group

## Support

For issues or questions about the scripts, refer to:

- Main README: `../RESPECT_GAME_README.md`
- Tests: `../test/RespectGame.test.ts`
- Contracts: `../contracts/`
