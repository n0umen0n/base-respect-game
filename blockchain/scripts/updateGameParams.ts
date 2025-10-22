import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

// The address of your deployed RespectGame contract
const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Updating game parameters on contract at: ${contractAddress}`);
  console.log(`Using signer: ${signer.address}`);

  const contract = (await ethers.getContractAt(
    "RespectGameCore",
    contractAddress
  )) as unknown as RespectGameCore;

  // New parameter values
  const membersWithoutApproval = 5;
  const submissionLength = 10 * 60; // 10 minutes in seconds
  const rankingLength = 10 * 60; // 10 minutes in seconds

  console.log("\nNew Parameters:");
  console.log(`  Members Without Approval: ${membersWithoutApproval}`);
  console.log(`  Submission Length: ${submissionLength}s (10 minutes)`);
  console.log(`  Ranking Length: ${rankingLength}s (10 minutes)`);

  console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to proceed...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\nUpdating game parameters...");

  try {
    const tx = await contract
      .connect(signer)
      .updateGameParams(
        membersWithoutApproval,
        submissionLength,
        rankingLength
      );
    console.log(`Transaction sent with hash: ${tx.hash}`);

    console.log("\nWaiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed.");
    console.log(`Gas used: ${receipt?.gasUsed.toString()}`);

    console.log("\n✅ Game parameters updated successfully!");

    // Read back the values to confirm
    const newMembersWithoutApproval = await contract.membersWithoutApproval();
    const newSubmissionLength = await contract.contributionSubmissionLength();
    const newRankingLength = await contract.contributionRankingLength();

    console.log("\nConfirmed New Values:");
    console.log(
      `  Members Without Approval: ${newMembersWithoutApproval.toString()}`
    );
    console.log(
      `  Submission Length: ${newSubmissionLength.toString()}s (${
        Number(newSubmissionLength) / (24 * 60 * 60)
      } days)`
    );
    console.log(
      `  Ranking Length: ${newRankingLength.toString()}s (${
        Number(newRankingLength) / (24 * 60 * 60)
      } days)`
    );
  } catch (error: any) {
    console.error("\n❌ Transaction failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
