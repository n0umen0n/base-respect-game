import { ethers } from "hardhat";
import { SimpleStorageImplementation } from "../typechain-types";

// The address of the proxy contract
const PROXY_ADDRESS = "0x556B5A5AC52B46AC09B2F8ceb30A482EE47eCbb8";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Checking owner with address:", deployerAddress);

  const simpleStorage = (await ethers.getContractAt(
    "SimpleStorageImplementation",
    PROXY_ADDRESS
  )) as SimpleStorageImplementation;

  try {
    const owner = await simpleStorage.owner();
    console.log(`The owner of the proxy at ${PROXY_ADDRESS} is: ${owner}`);

    if (owner.toLowerCase() === deployerAddress.toLowerCase()) {
      console.log("✅ The deployer is the owner.");
    } else {
      console.log("❌ The deployer is NOT the owner.");
    }
  } catch (error) {
    console.error("Failed to get owner:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
