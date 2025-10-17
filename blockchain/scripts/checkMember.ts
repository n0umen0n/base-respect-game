import { ethers } from "hardhat";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";
const memberToCheck = "0x9612319530E550b00A54Bdb57d143a6d378e178C";

async function main() {
  console.log(`Checking member: ${memberToCheck}`);
  console.log(`Contract at: ${contractAddress}\n`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress);

  const memberData = await contract.getMember(memberToCheck);

  console.log("Member Data:");
  console.log(`  Wallet: ${memberData.wallet}`);
  console.log(`  Name: "${memberData.name}"`);
  console.log(`  Profile URL: "${memberData.profileUrl}"`);
  console.log(`  Description: "${memberData.description}"`);
  console.log(`  X Account: "${memberData.xAccount}"`);
  console.log(`  Is Approved: ${memberData.isApproved}`);
  console.log(`  Is Banned: ${memberData.isBanned}`);
  console.log(
    `  Total Respect Earned: ${memberData.totalRespectEarned.toString()}`
  );
  console.log(`  Average Respect: ${memberData.averageRespect.toString()}`);

  if (memberData.wallet === ethers.ZeroAddress) {
    console.log("\n❌ This address is NOT a member (wallet is zero address)");
  } else {
    console.log("\n✅ This address IS a member");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
