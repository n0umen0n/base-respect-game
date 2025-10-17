import { ethers } from "hardhat";

const PROXY_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  console.log(`Finding members from events at: ${PROXY_ADDRESS}`);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(PROXY_ADDRESS);

  console.log("\nSearching for MemberJoined events...");

  try {
    // Get MemberJoined events from the contract
    const filter = contract.filters.MemberJoined();

    // Query events in small chunks due to RPC limitations (10 block range for free tier)
    const currentBlock = await ethers.provider.getBlockNumber();
    const totalBlocksToSearch = 1000; // Search last 1000 blocks
    const fromBlock = currentBlock - totalBlocksToSearch;
    const chunkSize = 10; // Free tier limit

    console.log(
      `Searching from block ${fromBlock} to ${currentBlock} in chunks of ${chunkSize}...`
    );

    let events: any[] = [];
    for (let i = fromBlock; i <= currentBlock; i += chunkSize) {
      const endBlock = Math.min(i + chunkSize - 1, currentBlock);
      try {
        const chunkEvents = await contract.queryFilter(filter, i, endBlock);
        events.push(...chunkEvents);
        if (chunkEvents.length > 0) {
          console.log(
            `Found ${chunkEvents.length} event(s) in blocks ${i}-${endBlock}`
          );
        }
      } catch (error) {
        console.log(`Error fetching blocks ${i}-${endBlock}, skipping...`);
      }
    }

    console.log(`\nFound ${events.length} MemberJoined event(s):\n`);

    for (const event of events) {
      const args = event.args;
      if (args) {
        console.log(`Member Address: ${args.member}`);
        console.log(`Name: ${args.name}`);
        console.log(`Auto Approved: ${args.autoApproved}`);
        console.log(`Block: ${event.blockNumber}`);
        console.log(`Transaction: ${event.transactionHash}`);

        // Get full member details
        const memberData = await contract.getMember(args.member);
        console.log(`Current Status:`);
        console.log(`  - Is Approved: ${memberData.isApproved}`);
        console.log(`  - Is Banned: ${memberData.isBanned}`);
        console.log(
          `  - Total Respect: ${memberData.totalRespectEarned.toString()}`
        );
        console.log(
          `  - Average Respect: ${memberData.averageRespect.toString()}`
        );
        console.log("─────────────────────────────────────────\n");
      }
    }

    if (events.length === 0) {
      console.log("No MemberJoined events found in the specified block range.");
      console.log(
        "Try increasing the block range or check BaseScan for the contract's transaction history."
      );
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
