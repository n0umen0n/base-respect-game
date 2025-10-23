import { ethers } from "hardhat";

const RESPECT_GAME_CORE_PROXY = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";
const GOVERNANCE_CONTRACT = "0x354d6b039f6d463b706a63f18227eb34d4fc93aa";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Setting governance contract with account:",
    await deployer.getAddress()
  );

  const core = await ethers.getContractAt(
    "RespectGameCore",
    RESPECT_GAME_CORE_PROXY
  );

  // Check current governance
  const currentGovernance = await core.governanceContract();
  console.log("\nCurrent governance contract:", currentGovernance);
  console.log("New governance contract:", GOVERNANCE_CONTRACT);

  if (currentGovernance.toLowerCase() === GOVERNANCE_CONTRACT.toLowerCase()) {
    console.log("\n✅ Governance contract is already set correctly!");
    console.log("No action needed.");
    return;
  }

  // Set the governance contract
  console.log("\n📝 Setting governance contract...");
  const tx = await core.setGovernanceContract(GOVERNANCE_CONTRACT);
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  // Verify it was set correctly
  const newGovernance = await core.governanceContract();
  console.log("\n✅ Governance contract updated!");
  console.log("New governance contract:", newGovernance);

  if (newGovernance.toLowerCase() === GOVERNANCE_CONTRACT.toLowerCase()) {
    console.log("\n✅✅✅ SUCCESS! Governance contract is now correctly set!");
  } else {
    console.log("\n❌ ERROR! Governance contract was not set correctly!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
