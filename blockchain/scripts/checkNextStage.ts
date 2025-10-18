import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const contract = (await ethers.getContractAt(
    "RespectGameCore",
    contractAddress
  )) as RespectGameCore;

  const currentGameNumber = await contract.currentGameNumber();
  const currentStage = await contract.getCurrentStage();
  const nextStageTimestamp = await contract.getNextStageTimestamp();
  const totalGroups = await contract.gameTotalGroups(currentGameNumber);

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilSwitch = Number(nextStageTimestamp) - currentTime;

  console.log("=== Current Game State ===");
  console.log(`Game Number: ${currentGameNumber}`);
  console.log(
    `Stage: ${
      currentStage === 0 ? "Contribution Submission" : "Contribution Ranking"
    }`
  );
  console.log(`Total Groups: ${totalGroups}`);
  console.log();
  console.log(`Current Time: ${new Date(currentTime * 1000).toLocaleString()}`);
  console.log(
    `Next Stage Time: ${new Date(
      Number(nextStageTimestamp) * 1000
    ).toLocaleString()}`
  );
  console.log();

  if (timeUntilSwitch > 0) {
    const hours = Math.floor(timeUntilSwitch / 3600);
    const minutes = Math.floor((timeUntilSwitch % 3600) / 60);
    const seconds = timeUntilSwitch % 60;
    console.log(`⏰ Time until next stage: ${hours}h ${minutes}m ${seconds}s`);
    console.log(`\n⚠️  Cannot switch stage yet. Please wait.`);
  } else {
    console.log(`✅ Stage switch is available now!`);
    console.log(
      `You can run: npx hardhat run scripts/switchStage.ts --network base-mainnet`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
