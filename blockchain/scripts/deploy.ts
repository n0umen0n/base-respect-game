import { ethers, upgrades } from "hardhat";

async function main(): Promise<void> {
  // Get the deployer's address (first account from the connected provider)
  const [deployer] = await ethers.getSigners();
  const adminAddress = await deployer.getAddress();

  console.log("Deploying with admin address:", adminAddress);

  const SimpleStorage = await ethers.getContractFactory(
    "SimpleStorageImplementation"
  );
  console.log("Deploying SimpleStorageImplementation...");

  const simpleStorage = await upgrades.deployProxy(
    SimpleStorage,
    [adminAddress],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await simpleStorage.waitForDeployment();
  console.log(
    "SimpleStorageImplementation deployed to:",
    await simpleStorage.getAddress()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
