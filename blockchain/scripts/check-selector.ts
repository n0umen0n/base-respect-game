import { ethers } from "hardhat";

async function main(): Promise<void> {
  console.log("Checking function selectors...\n");

  const removeMemberSelector = ethers.id("removeMember(address)").slice(0, 10);
  console.log("removeMember(address):", removeMemberSelector);

  const transferSelector = ethers.id("transfer(address,uint256)").slice(0, 10);
  console.log("transfer(address,uint256):", transferSelector);

  console.log("\nFrontend is using: 0x0c498909");
  console.log("Match:", removeMemberSelector === "0x0c498909" ? "✅" : "❌");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
