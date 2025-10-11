import { ethers } from "hardhat";
import { SimpleStorageImplementation } from "../typechain-types";

// The address of your deployed contract on Base Mainnet
const contractAddress = "0x179fE541e30a3Ac1e52Bc6882220D926D4f7E349";

async function main() {
  const [signer] = await ethers.getSigners();

  // Get the number to set from the environment variable
  const numberToSet = process.env.SET_NUMBER;
  if (!numberToSet) {
    console.error(
      "Please provide a number to set via the SET_NUMBER environment variable."
    );
    console.error(
      "Example: SET_NUMBER=42 npx hardhat run scripts/setNumber.ts --network base-mainnet"
    );
    process.exit(1);
  }

  console.log(
    `Setting number to ${numberToSet} for contract at: ${contractAddress}`
  );

  const SimpleStorage = await ethers.getContractFactory(
    "SimpleStorageImplementation"
  );
  const contract = SimpleStorage.attach(
    contractAddress
  ) as SimpleStorageImplementation;

  const tx = await contract.connect(signer).setNumber(numberToSet);
  console.log(`Transaction sent with hash: ${tx.hash}`);

  await tx.wait();
  console.log("Transaction confirmed.");

  const newNumber = await contract.getNumber();
  console.log(`The stored number is now: ${newNumber.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
