import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

// The address of your deployed RespectGame contract
const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Triggering stage switch on contract at: ${contractAddress}`);
  console.log(`Using signer: ${signer.address}`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress) as RespectGameCore;

  // Get current stage information
  try {
    const currentStage = await contract.getCurrentStage();
    const nextStageTimestamp = await contract.getNextStageTimestamp();
    const currentGameNumber = await contract.currentGameNumber();
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("\nCurrent Game State:");
    console.log(`  Game Number: ${currentGameNumber.toString()}`);
    console.log(
      `  Current Stage: ${
        currentStage === 0 ? "Contribution Submission" : "Contribution Ranking"
      }`
    );
    console.log(
      `  Next Stage Timestamp: ${nextStageTimestamp.toString()} (${new Date(
        Number(nextStageTimestamp) * 1000
      ).toLocaleString()})`
    );
    console.log(
      `  Current Timestamp: ${currentTime} (${new Date(
        currentTime * 1000
      ).toLocaleString()})`
    );

    const timeUntilSwitch = Number(nextStageTimestamp) - currentTime;
    if (timeUntilSwitch > 0) {
      const hours = Math.floor(timeUntilSwitch / 3600);
      const minutes = Math.floor((timeUntilSwitch % 3600) / 60);
      console.log(
        `\n⚠️  WARNING: Stage switch is not yet available. Please wait ${hours}h ${minutes}m.`
      );
      console.log("The transaction will likely revert if you proceed.");
      console.log(
        "\nPress Ctrl+C to cancel, or wait 5 seconds to proceed anyway..."
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      console.log("\n✅ Stage switch is available!");
      console.log(
        `\nThis will switch from ${
          currentStage === 0
            ? "Contribution Submission to Ranking"
            : "Ranking to Contribution Submission (new game)"
        }`
      );
      console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to proceed...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (error) {
    console.error("Failed to get current game state:", error);
    console.log("\nProceeding anyway...");
  }

  console.log("\nTriggering stage switch...");

  try {
    const tx = await contract.connect(signer).switchStage();
    console.log(`Transaction sent with hash: ${tx.hash}`);

    console.log("\nWaiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed.");
    console.log(`Gas used: ${receipt?.gasUsed.toString()}`);

    // Get updated stage information
    const newStage = await contract.getCurrentStage();
    const newNextStageTimestamp = await contract.getNextStageTimestamp();
    const newGameNumber = await contract.currentGameNumber();

    console.log("\n✅ Stage switch completed successfully!");
    console.log("\nNew Game State:");
    console.log(`  Game Number: ${newGameNumber.toString()}`);
    console.log(
      `  Current Stage: ${
        newStage === 0 ? "Contribution Submission" : "Contribution Ranking"
      }`
    );
    console.log(
      `  Next Stage Timestamp: ${newNextStageTimestamp.toString()} (${new Date(
        Number(newNextStageTimestamp) * 1000
      ).toLocaleString()})`
    );
  } catch (error: any) {
    console.error("\n❌ Transaction failed!");
    if (error.message.includes("Too early to switch stage")) {
      console.error(
        "Error: The stage switch time has not been reached yet. Please wait until the next stage timestamp."
      );
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
