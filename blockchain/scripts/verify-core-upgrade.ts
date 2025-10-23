import { ethers } from "hardhat";

const RESPECT_GAME_CORE = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";
const GOVERNANCE_CONTRACT = "0x354d6b039f6d463b706a63f18227eb34d4fc93aa";

async function main(): Promise<void> {
  console.log("🔍 Verifying RespectGameCore upgrade...\n");

  const core = await ethers.getContractAt("RespectGameCore", RESPECT_GAME_CORE);

  // Check if governance contract is set
  const govAddress = await core.governanceContract();
  console.log("✅ Governance contract:", govAddress);

  // Try to call removeMember with a static call to see what happens
  console.log("\n🔧 Testing removeMember function...");
  console.log(
    "Attempting to call removeMember as governance contract (simulation)..."
  );

  // Get a test member address (KRUGLOFF from the proposal)
  const testMember = "0x1274d4459632d7d52B7eE3Baef3cC20a21dE4Cea";

  try {
    // Try to simulate the call as if it came from the governance contract
    // This will show us the actual revert reason
    const iface = new ethers.Interface([
      "function removeMember(address member) external",
    ]);

    const calldata = iface.encodeFunctionData("removeMember", [testMember]);

    console.log("Calldata:", calldata);
    console.log("Target:", RESPECT_GAME_CORE);
    console.log("Calling from (simulating governance):", GOVERNANCE_CONTRACT);

    // Use provider to make a static call
    const provider = ethers.provider;
    const result = await provider.call({
      to: RESPECT_GAME_CORE,
      from: GOVERNANCE_CONTRACT,
      data: calldata,
    });

    console.log("\n✅ Call succeeded! Result:", result);
  } catch (error: any) {
    console.log("\n❌ Call failed!");
    console.log("Error:", error.message);

    // Try to decode the revert reason
    if (error.data) {
      console.log("Revert data:", error.data);

      // Try to decode as string
      try {
        const reason = ethers.AbiCoder.defaultAbiCoder().decode(
          ["string"],
          "0x" + error.data.slice(10)
        );
        console.log("Revert reason:", reason[0]);
      } catch (e) {
        console.log("Could not decode revert reason");
      }
    }

    // Check if the function even exists
    console.log("\n🔍 Checking if removeMember function exists...");
    try {
      const code = await provider.getCode(RESPECT_GAME_CORE);
      console.log("Contract code length:", code.length);
      console.log("Contract has code:", code !== "0x");
    } catch (e) {
      console.log("Error getting code:", e);
    }
  }

  // Also verify the owner
  console.log("\n🔍 Contract owner info:");
  const owner = await core.owner();
  console.log("Owner:", owner);

  const [deployer] = await ethers.getSigners();
  const signerAddress = await deployer.getAddress();
  console.log("Current signer:", signerAddress);
  console.log(
    "Is signer the owner?",
    owner.toLowerCase() === signerAddress.toLowerCase()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
