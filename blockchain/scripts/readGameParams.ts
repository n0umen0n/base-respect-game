import { ethers } from "hardhat";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const contract = await ethers.getContractAt("RespectGameCore", contractAddress);

  const submissionLength = await contract.contributionSubmissionLength();
  const rankingLength = await contract.contributionRankingLength();
  const nextStageTimestamp = await contract.nextStageTimestamp();
  const currentStage = await contract.getCurrentStage();

  console.log("\n=== Current Game Parameters ===");
  console.log(`Submission Length: ${submissionLength.toString()}s (${Number(submissionLength) / 3600} hours)`);
  console.log(`Ranking Length: ${rankingLength.toString()}s (${Number(rankingLength) / 60} minutes)`);
  console.log(`Next Stage: ${nextStageTimestamp.toString()} (${new Date(Number(nextStageTimestamp) * 1000).toISOString()})`);
  console.log(`Current Stage: ${currentStage === 0 ? "Submission" : "Ranking"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


