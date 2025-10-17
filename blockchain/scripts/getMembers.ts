import { ethers } from "hardhat";

const PROXY_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  console.log(`Fetching members from contract at: ${PROXY_ADDRESS}`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(PROXY_ADDRESS);

  // Get member count (functions commented out to reduce contract size)
  // const memberCount = await contract.getMemberCount();
  // const approvedMemberCount = await contract.getApprovedMemberCount();

  // console.log(`\nTotal members: ${memberCount.toString()}`);
  // console.log(`Approved members: ${approvedMemberCount.toString()}`);

  // Since we don't have a function to get all member addresses,
  // we'll try to get the member at index 0 from the memberList
  // Let's get the current game info first
  console.log("\n=== Current Game Info ===");
  const currentGameNumber = await contract.currentGameNumber();
  const currentStage = await contract.getCurrentStage();
  console.log(`Current game number: ${currentGameNumber.toString()}`);
  console.log(
    `Current stage: ${currentStage.toString()} (0=Submission, 1=Ranking)`
  );

  // Try to get contributor list for game 1
  console.log("\n=== Attempting to get members ===");
  console.log("Note: We can't directly list all members from storage.");
  console.log(
    "If you know a member address, use getMember(address) to get their info."
  );
  console.log("\nExample member addresses to try:");
  console.log("- Your deployer address");
  console.log("- Check transaction history on BaseScan for becomeMember calls");

  // Get top members
  console.log("\n=== Top 6 Members ===");
  try {
    const topMembers = await contract.getTopMembers();
    console.log(`Top members array: ${topMembers}\n`);

    let foundMembers = 0;
    for (let i = 0; i < topMembers.length; i++) {
      const memberAddress = topMembers[i];
      if (memberAddress !== ethers.ZeroAddress) {
        foundMembers++;
        console.log(`\n[${i + 1}] Member Address: ${memberAddress}`);

        const memberData = await contract.getMember(memberAddress);
        console.log(`  Name: ${memberData.name}`);
        console.log(`  Profile URL: ${memberData.profileUrl}`);
        console.log(`  Description: ${memberData.description}`);
        console.log(`  X Account: ${memberData.xAccount}`);
        console.log(`  Is Approved: ${memberData.isApproved}`);
        console.log(`  Is Banned: ${memberData.isBanned}`);
        console.log(
          `  Total Respect Earned: ${memberData.totalRespectEarned.toString()}`
        );
        console.log(
          `  Average Respect: ${memberData.averageRespect.toString()}`
        );
      }
    }

    if (foundMembers === 0) {
      console.log("No members found in top 6.");
    } else {
      console.log(`\n✅ Found ${foundMembers} member(s) in top 6`);
    }
  } catch (error) {
    console.log("❌ Error fetching top members:", error);
  }

  // Also check the signer address
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log(`\n\n=== Checking signer address: ${signerAddress} ===`);
  try {
    const memberData = await contract.getMember(signerAddress);
    if (memberData.wallet !== ethers.ZeroAddress) {
      console.log("✅ Signer is a member");
      console.log(`  Name: ${memberData.name}`);
      console.log(`  Is Approved: ${memberData.isApproved}`);
      console.log(
        `  Total Respect Earned: ${memberData.totalRespectEarned.toString()}`
      );
    } else {
      console.log("❌ Signer is not a member");
    }
  } catch (error) {
    console.log("❌ Error fetching member data:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
