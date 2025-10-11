import { ethers, upgrades } from "hardhat";

// The address of your deployed proxy contract on Base Mainnet
const PROXY_ADDRESS = "0x179fE541e30a3Ac1e52Bc6882220D926D4f7E349";

async function main() {
  console.log(`Checking admin for proxy contract at: ${PROXY_ADDRESS}`);

  try {
    const adminAddress = await upgrades.erc1967.getAdminAddress(PROXY_ADDRESS);
    console.log(`✅ The on-chain admin for upgrades is: ${adminAddress}`);

    // We can also get the owner for comparison
    const SimpleStorage = await ethers.getContractFactory(
      "SimpleStorageImplementation"
    );
    const contract = SimpleStorage.attach(PROXY_ADDRESS);
    const ownerAddress = await contract.owner();
    console.log(`✅ The on-chain owner is: ${ownerAddress}`);

    if (adminAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.log(
        "\n⚠️  WARNING: The admin address and the owner address are different!"
      );
      console.log(
        "This is the likely cause of the upgrade failure. The admin address must be used to sign the upgrade transaction."
      );
    }
  } catch (error) {
    console.error("❌ Failed to retrieve the admin address.", error);
    console.log(
      "This could mean the contract is not a valid UUPS proxy or there's a network issue."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
