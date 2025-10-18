import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

// The address of your deployed RespectGame contract
const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Debugging contract at: ${contractAddress}`);
  console.log(`Using signer: ${signer.address}\n`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress) as RespectGameCore;

  try {
    // Basic game state
    const currentGameNumber = await contract.currentGameNumber();
    const currentStage = await contract.getCurrentStage();
    const nextStageTimestamp = await contract.getNextStageTimestamp();

    console.log("=== BASIC GAME STATE ===");
    console.log(`Game Number: ${currentGameNumber.toString()}`);
    console.log(
      `Current Stage: ${
        currentStage === 0 ? "Contribution Submission" : "Contribution Ranking"
      }`
    );
    console.log(`Next Stage Timestamp: ${nextStageTimestamp.toString()}`);

    // Processing state
    const isProcessing = await contract.isProcessingStageSwitch();
    const groupingProgress = await contract.groupingBatchProgress();
    const rankingProgress = await contract.rankingCalculationGroupProgress();

    console.log("\n=== PROCESSING STATE ===");
    console.log(`Is Processing Stage Switch: ${isProcessing}`);
    console.log(`Grouping Batch Progress: ${groupingProgress.toString()}`);
    console.log(`Ranking Calculation Progress: ${rankingProgress.toString()}`);

    // Game data
    const totalGroups = await contract.gameTotalGroups(currentGameNumber);
    console.log("\n=== GAME DATA ===");
    console.log(
      `Total Groups in Game ${currentGameNumber}: ${totalGroups.toString()}`
    );

    // Try to get contributors
    try {
      const contributors = await contract.gameContributors(
        currentGameNumber,
        0
      );
      console.log(`First contributor: ${contributors}`);
    } catch (e) {
      console.log("Could not access contributors array directly");
    }

    // Check if there are any groups
    if (totalGroups > 0n) {
      console.log("\n=== GROUP DETAILS ===");
      for (let i = 0; i < Math.min(Number(totalGroups), 5); i++) {
        try {
          const groupMembers = await contract.getGroup(currentGameNumber, i);
          console.log(`Group ${i}: ${groupMembers.length} members`);
          groupMembers.forEach((member: string, idx: number) => {
            console.log(`  [${idx}] ${member}`);
          });

          // Check group size
          const groupSize = await contract.groupSizes(currentGameNumber, i);
          console.log(`  Group Size Variable: ${groupSize.toString()}`);

          // Check if group is finalized
          const group = await contract.groups(currentGameNumber, i);
          console.log(`  Finalized: ${group.finalized}`);
        } catch (e: any) {
          console.log(`  Error getting group ${i}: ${e.message}`);
        }
      }
    } else {
      console.log("\n⚠️  NO GROUPS CREATED - This might be the issue!");
    }

    // Check member list
    try {
      const memberListLength = await contract.memberList(0);
      console.log("\n=== MEMBER INFO ===");
      console.log(
        `Member list has entries (checking first): ${memberListLength}`
      );
    } catch (e) {
      console.log("\n=== MEMBER INFO ===");
      console.log("Cannot directly check memberList length");
    }

    // Check approved member count
    const approvedMemberCount = await contract.approvedMemberCount();
    console.log(`Approved Member Count: ${approvedMemberCount.toString()}`);

    // Try to simulate the switchStage call to get the revert reason
    console.log("\n=== SIMULATING SWITCH STAGE ===");
    try {
      await contract.switchStage.staticCall();
      console.log("✅ Static call succeeded - transaction should work!");
    } catch (error: any) {
      console.log("❌ Static call failed with error:");
      console.log(error.message);

      // Try to extract revert reason
      if (error.data) {
        console.log("\nRevert data:", error.data);
      }
      if (error.reason) {
        console.log("Revert reason:", error.reason);
      }
    }
  } catch (error: any) {
    console.error("Error during debugging:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
