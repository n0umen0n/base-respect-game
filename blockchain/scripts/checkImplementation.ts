import { ethers, upgrades } from "hardhat";

const PROXY_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main() {
  console.log("Checking implementation address for proxy:", PROXY_ADDRESS);

  try {
    const implAddress = await upgrades.erc1967.getImplementationAddress(
      PROXY_ADDRESS
    );
    console.log("\nCurrent implementation address:", implAddress);

    // Try to get the implementation contract
    const impl = await ethers.getContractAt("RespectGameCore", implAddress);

    console.log("\nTrying to read implementation contract code...");
    const code = await ethers.provider.getCode(implAddress);
    console.log("Implementation code length:", code.length);
    console.log("First 100 chars:", code.substring(0, 100));

    // Check admin
    const adminAddress = await upgrades.erc1967.getAdminAddress(PROXY_ADDRESS);
    console.log("\nProxy admin address:", adminAddress);
  } catch (error: any) {
    console.error("Error:", error.message);
  }

  // Also check using the proxy directly
  console.log("\n=== Checking proxy state ===");
  const proxy = await ethers.getContractAt("RespectGameCore", PROXY_ADDRESS);

  const owner = await proxy.owner();
  const currentGameNumber = await proxy.currentGameNumber();
  const currentStage = await proxy.getCurrentStage();
  const totalGroups = await proxy.gameTotalGroups(currentGameNumber);

  console.log("Owner:", owner);
  console.log("Game Number:", currentGameNumber.toString());
  console.log("Stage:", currentStage === 0 ? "Submission" : "Ranking");
  console.log("Total Groups:", totalGroups.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
