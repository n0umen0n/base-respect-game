import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Detailed stage switch analysis`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Signer: ${signer.address}\n`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress) as RespectGameCore;

  // Get current state
  const currentGameNumber = await contract.currentGameNumber();
  const currentStage = await contract.getCurrentStage();
  const totalGroups = await contract.gameTotalGroups(currentGameNumber);
  const isProcessing = await contract.isProcessingStageSwitch();
  const nextStageTimestamp = await contract.getNextStageTimestamp();

  console.log("Current State:");
  console.log(`  Game: ${currentGameNumber}`);
  console.log(`  Stage: ${currentStage === 0 ? "Submission" : "Ranking"}`);
  console.log(`  Total Groups: ${totalGroups}`);
  console.log(`  Is Processing: ${isProcessing}`);
  console.log(`  Next Stage Timestamp: ${nextStageTimestamp}`);

  // Try static call first
  console.log("\n1️⃣ Testing with static call...");
  try {
    await contract.switchStage.staticCall();
    console.log("✅ Static call succeeded!");
  } catch (error: any) {
    console.log("❌ Static call failed:", error.message);
    process.exit(1);
  }

  // Try with manual gas estimation
  console.log("\n2️⃣ Estimating gas...");
  let gasEstimate;
  try {
    gasEstimate = await contract.switchStage.estimateGas();
    console.log(`Gas estimate: ${gasEstimate.toString()}`);
  } catch (error: any) {
    console.log("⚠️ Gas estimation failed:", error.message);
    console.log("Using fallback gas limit of 3,000,000");
    gasEstimate = 3000000n;
  }

  // Try with 50% more gas than estimated
  const gasLimit = (gasEstimate * 150n) / 100n;
  console.log(`Using gas limit: ${gasLimit.toString()}`);

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log(`\nCurrent gas price: ${feeData.gasPrice?.toString()}`);
  console.log(`Max fee per gas: ${feeData.maxFeePerGas?.toString()}`);
  console.log(`Max priority fee: ${feeData.maxPriorityFeePerGas?.toString()}`);

  console.log("\n3️⃣ Sending transaction with explicit parameters...");
  try {
    const tx = await contract.connect(signer).switchStage({
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas || undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
    });

    console.log(`✅ Transaction sent: ${tx.hash}`);
    console.log(`Nonce: ${tx.nonce}`);
    console.log(`Gas limit: ${tx.gasLimit?.toString()}`);

    console.log("\n4️⃣ Waiting for confirmation...");
    const receipt = await tx.wait();

    if (!receipt) {
      console.log("❌ No receipt returned");
      process.exit(1);
    }

    console.log(`\nBlock: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
    console.log(`Logs: ${receipt.logs.length}`);

    if (receipt.status === 0) {
      console.log("\n❌ Transaction reverted on-chain!");
      console.log("This shouldn't happen since static call succeeded...");

      // Try to parse logs
      receipt.logs.forEach((log, i) => {
        console.log(`\nLog ${i}:`, log);
      });

      process.exit(1);
    }

    // Success! Check new state
    const newGameNumber = await contract.currentGameNumber();
    const newStage = await contract.getCurrentStage();
    const newNextStageTimestamp = await contract.getNextStageTimestamp();

    console.log("\n✅✅✅ SUCCESS!");
    console.log("\nNew State:");
    console.log(`  Game: ${newGameNumber}`);
    console.log(`  Stage: ${newStage === 0 ? "Submission" : "Ranking"}`);
    console.log(
      `  Next Stage: ${new Date(
        Number(newNextStageTimestamp) * 1000
      ).toLocaleString()}`
    );
  } catch (error: any) {
    console.log("\n❌ Transaction failed!");
    console.error("Error message:", error.message);

    if (error.receipt) {
      console.log("\nReceipt details:");
      console.log(`  Block: ${error.receipt.blockNumber}`);
      console.log(`  Status: ${error.receipt.status}`);
      console.log(`  Gas used: ${error.receipt.gasUsed?.toString()}`);
      console.log(`  Logs: ${error.receipt.logs.length}`);
    }

    if (error.transaction) {
      console.log("\nTransaction details:");
      console.log(`  From: ${error.transaction.from}`);
      console.log(`  To: ${error.transaction.to}`);
      console.log(`  Data: ${error.transaction.data}`);
      console.log(`  Gas limit: ${error.transaction.gasLimit?.toString()}`);
    }

    // Try to decode revert reason
    if (error.data) {
      console.log("\nRevert data:", error.data);
      try {
        const reason = ethers.toUtf8String("0x" + error.data.slice(138));
        console.log("Decoded reason:", reason);
      } catch (e) {
        console.log("Could not decode revert reason");
      }
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
