import { ethers } from "hardhat";
import { RespectGameCore } from "../typechain-types";

// The address of your deployed RespectGame contract
const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  const [signer] = await ethers.getSigners();

  // Get the member address to remove from the environment variable
  const memberToRemove = process.env.MEMBER_ADDRESS;
  if (!memberToRemove) {
    console.error(
      "Please provide a member address to remove via the MEMBER_ADDRESS environment variable."
    );
    console.error(
      "Example: MEMBER_ADDRESS=0x1234... npx hardhat run scripts/removeMember.ts --network base-mainnet"
    );
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(memberToRemove)) {
    console.error(`Invalid Ethereum address: ${memberToRemove}`);
    process.exit(1);
  }

  console.log(`Removing member: ${memberToRemove}`);
  console.log(`From contract at: ${contractAddress}`);
  console.log(`Using signer: ${signer.address}`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress) as RespectGameCore;

  // Check if the member exists before removing
  try {
    const memberData = await contract.getMember(memberToRemove);
    console.log("\nMember details:");
    console.log(`  Name: ${memberData.name}`);
    console.log(`  Approved: ${memberData.isApproved}`);
    console.log(`  Banned: ${memberData.isBanned}`);
    console.log(
      `  Total Respect Earned: ${memberData.totalRespectEarned.toString()}`
    );
    console.log(`  Average Respect: ${memberData.averageRespect.toString()}`);
  } catch (error) {
    console.error("Failed to get member data. Member may not exist.");
    process.exit(1);
  }

  // Confirm removal
  console.log(
    "\n⚠️  WARNING: This will permanently remove the member and all their data!"
  );
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("\nProceeding with member removal...");

  const tx = await contract.connect(signer).removeMember(memberToRemove);
  console.log(`Transaction sent with hash: ${tx.hash}`);

  await tx.wait();
  console.log("Transaction confirmed.");
  console.log(`✅ Member ${memberToRemove} has been removed successfully.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
