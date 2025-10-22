import { ethers } from "hardhat";

async function main() {
  console.log("Testing member proposal creation...");

  const CORE_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Get the contract
  const core = await ethers.getContractAt("RespectGameCore", CORE_ADDRESS);

  // Check current member count
  const memberList = await core.memberList(0);
  console.log("First member:", memberList);

  // Check if we're already a member
  const member = await core.members(deployer.address);
  console.log("Are we a member?", member.wallet !== ethers.ZeroAddress);

  if (member.wallet !== ethers.ZeroAddress) {
    console.log("Already a member. Use a different account to test.");
    console.log("Member info:", {
      name: member.name,
      isApproved: member.isApproved,
      isBanned: member.isBanned,
    });
    return;
  }

  // Try to become a member
  console.log("\nCalling becomeMember...");
  const tx = await core.becomeMember(
    "Test Member",
    "https://example.com/profile.jpg",
    "Testing member proposal system",
    "@testaccount"
  );

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Transaction confirmed!");
  console.log("Block number:", receipt.blockNumber);

  // Check for events
  console.log("\nEvents emitted:");
  for (const log of receipt.logs) {
    try {
      const parsed = core.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed) {
        console.log(`- ${parsed.name}`);
        if (parsed.name === "MemberProposalCreated") {
          console.log("  ✅ Member proposal created!");
          console.log("  Proposal ID:", parsed.args.proposalId?.toString());
          console.log("  Candidate:", parsed.args.candidate);
          console.log("  Name:", parsed.args.name);
        }
      }
    } catch (e) {
      // Skip logs we can't parse
    }
  }

  console.log(
    "\n✅ Check your proposals page - you should see a new member proposal!"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
