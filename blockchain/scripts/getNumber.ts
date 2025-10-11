import { ethers } from "hardhat";
import { SimpleStorageImplementation } from "../typechain-types";

// The address of your deployed contract on Base Mainnet
const contractAddress = "0x179fE541e30a3Ac1e52Bc6882220D926D4f7E349";

async function main() {
  console.log(`Fetching number from contract at: ${contractAddress}`);

  const SimpleStorage = await ethers.getContractFactory(
    "SimpleStorageImplementation"
  );
  const contract = SimpleStorage.attach(
    contractAddress
  ) as SimpleStorageImplementation;

  const number = await contract.getNumber();

  console.log(`The stored number is: ${number.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
