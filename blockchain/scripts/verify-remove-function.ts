import { ethers } from "hardhat";

const PROXY_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main(): Promise<void> {
  console.log("Verifying removeMember function exists...");
  console.log("Proxy address:", PROXY_ADDRESS);

  const contract = await ethers.getContractAt("RespectGameCore", PROXY_ADDRESS);

  // Check if the function exists in the ABI
  const hasRemoveMember = contract.interface.hasFunction("removeMember");
  console.log("Has removeMember in ABI:", hasRemoveMember);

  // Try to get the function
  try {
    const removeMemberFunc = contract.getFunction("removeMember");
    console.log("✅ removeMember function found:", removeMemberFunc.name);
  } catch (error) {
    console.log("❌ removeMember function not found");
  }

  // Check contract bytecode
  const code = await ethers.provider.getCode(PROXY_ADDRESS);
  console.log("Contract has code:", code.length > 2 ? "Yes" : "No");
  console.log("Code length:", code.length, "characters");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
