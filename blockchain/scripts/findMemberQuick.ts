import { ethers } from "hardhat";

const contractAddress = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  console.log("Looking for members via BaseScan API...");
  console.log("Contract:", contractAddress);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");
  const contract = RespectGame.attach(contractAddress);

  // Try searching recent blocks in very small chunks
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  // Search last 100 blocks only
  const fromBlock = Math.max(0, currentBlock - 100);
  const chunkSize = 10;

  console.log(`\nSearching blocks ${fromBlock} to ${currentBlock}...`);

  const filter = contract.filters.MemberJoined();

  for (let i = fromBlock; i <= currentBlock; i += chunkSize) {
    const endBlock = Math.min(i + chunkSize - 1, currentBlock);
    try {
      const events = await contract.queryFilter(filter, i, endBlock);
      if (events.length > 0) {
        console.log(`\n✅ Found ${events.length} member(s)!\n`);
        for (const event of events) {
          const args = event.args;
          if (args) {
            console.log(`Member Address: ${args.member}`);
            console.log(`Name: ${args.name}`);
            console.log(`Auto Approved: ${args.autoApproved}`);
            console.log(`Block: ${event.blockNumber}`);
            console.log(`Transaction: ${event.transactionHash}\n`);
          }
        }
        return;
      }
    } catch (error) {
      // Skip errors
    }
  }

  console.log("\n❌ No members found in recent blocks.");
  console.log("\nPlease check BaseScan manually:");
  console.log(`https://basescan.org/address/${contractAddress}#events`);
  console.log("Look for 'MemberJoined' events to find member addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
