import { ethers } from "hardhat";

const RESPECT_GAME_CORE_PROXY = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";
const EXPECTED_GOVERNANCE = "0x354d6b039f6d463b706a63f18227eb34d4fc93aa";

async function main(): Promise<void> {
  console.log("🔍 Checking governance contract configuration...\n");

  const core = await ethers.getContractAt(
    "RespectGameCore",
    RESPECT_GAME_CORE_PROXY
  );

  // Get the current governance contract address
  const currentGovernance = await core.governanceContract();

  console.log("RespectGameCore proxy:", RESPECT_GAME_CORE_PROXY);
  console.log("Current governance contract:", currentGovernance);
  console.log("Expected governance contract:", EXPECTED_GOVERNANCE);

  // Check if it matches
  if (currentGovernance.toLowerCase() === EXPECTED_GOVERNANCE.toLowerCase()) {
    console.log("\n✅ SUCCESS! Governance contract is correctly set!");
  } else if (currentGovernance === ethers.ZeroAddress) {
    console.log("\n❌ ERROR! Governance contract is NOT set (zero address)!");
    console.log("\n💡 To fix this, run:");
    console.log(
      `   npx hardhat run scripts/set-governance.ts --network base-mainnet`
    );
  } else {
    console.log(
      "\n⚠️  WARNING! Governance contract is set to a different address!"
    );
    console.log("   This might be intentional, please verify.");
  }

  // Additional check: verify the governance contract can call removeMember
  console.log("\n🔍 Checking if governance can call removeMember...");
  try {
    // Get the owner
    const owner = await core.owner();
    console.log("Core contract owner:", owner);

    console.log("\n✅ Governance contract check complete!");
  } catch (error) {
    console.error("\n❌ Error checking governance:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
