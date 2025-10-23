import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Getting current game stage...`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Querying from: ${signer.address}\n`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress) as RespectGameCore;

  // Get current state
  const currentGameNumber = await contract.currentGameNumber();
  const currentStage = await contract.getCurrentStage();
  const totalGroups = await contract.gameTotalGroups(currentGameNumber);
  const isProcessing = await contract.isProcessingStageSwitch();
  const nextStageTimestamp = await contract.getNextStageTimestamp();

  console.log("═══════════════════════════════════════");
  console.log("         CURRENT GAME STATE");
  console.log("═══════════════════════════════════════");
  console.log(`Game Number:       ${currentGameNumber}`);
  console.log(
    `Current Stage:     ${
      currentStage === 0 ? "Submission" : "Ranking"
    } (${currentStage})`
  );
  console.log(`Total Groups:      ${totalGroups}`);
  console.log(`Is Processing:     ${isProcessing ? "Yes" : "No"}`);
  console.log(
    `Next Stage Time:   ${new Date(
      Number(nextStageTimestamp) * 1000
    ).toLocaleString()}`
  );
  console.log(`Current Time:      ${new Date().toLocaleString()}`);

  const now = Math.floor(Date.now() / 1000);
  const timeUntilNext = Number(nextStageTimestamp) - now;

  if (timeUntilNext > 0) {
    const hours = Math.floor(timeUntilNext / 3600);
    const minutes = Math.floor((timeUntilNext % 3600) / 60);
    console.log(`Time Until Next:   ${hours}h ${minutes}m`);
  } else {
    console.log(`Time Until Next:   Ready to switch!`);
  }
  console.log("═══════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
