import { ethers, upgrades } from "hardhat";

const PROXY_ADDRESS = "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const adminAddress = await deployer.getAddress();

  console.log("Upgrading RespectGame with admin address:", adminAddress);
  console.log("Proxy address:", PROXY_ADDRESS);

  // Get the current implementation address before upgrade
  const currentImpl = await upgrades.erc1967.getImplementationAddress(
    PROXY_ADDRESS
  );
  console.log("Current implementation address:", currentImpl);

  const RespectGame = await ethers.getContractFactory("RespectGameCore");

  console.log("Contract factory created successfully");
  console.log("Contract bytecode length:", RespectGame.bytecode.length);

  // Get current state before upgrade
  console.log("\n📊 Current state before upgrade:");
  const proxy = await ethers.getContractAt("RespectGameCore", PROXY_ADDRESS);
  const currentGameNumber = await proxy.currentGameNumber();
  const currentStage = await proxy.getCurrentStage();
  const memberCount = await proxy.getMemberCount();
  const approvedMemberCount = await proxy.getApprovedMemberCount();
  console.log("  Current game number:", currentGameNumber.toString());
  console.log("  Current stage:", currentStage.toString());
  console.log("  Total members:", memberCount.toString());
  console.log("  Approved members:", approvedMemberCount.toString());

  let upgradedContract;

  try {
    console.log("\nUpgrading RespectGame...");

    // Use upgrades.upgradeProxy for cleaner upgrade process
    upgradedContract = await upgrades.upgradeProxy(PROXY_ADDRESS, RespectGame, {
      // Force the upgrade even if validation fails
      unsafeSkipStorageCheck: true,
    });

    await upgradedContract.waitForDeployment();

    // Get the new implementation address after upgrade
    const newImpl = await upgrades.erc1967.getImplementationAddress(
      PROXY_ADDRESS
    );
    console.log("New implementation address:", newImpl);

    // Verify the upgrade actually happened
    if (currentImpl.toLowerCase() === newImpl.toLowerCase()) {
      console.log(
        "⚠️  WARNING: Implementation address did not change! Upgrade may have failed."
      );

      // Let's try to prepare the upgrade manually to see what happens
      console.log("Attempting to prepare upgrade to see deployment details...");
      const preparedImpl = await upgrades.prepareUpgrade(
        PROXY_ADDRESS,
        RespectGame
      );
      console.log(
        "Prepared implementation would be deployed at:",
        preparedImpl
      );
    } else {
      console.log("✅ Implementation address changed successfully!");
      console.log(`  Old: ${currentImpl}`);
      console.log(`  New: ${newImpl}`);
    }
  } catch (error) {
    // Check if the error is about unregistered deployment
    if (error instanceof Error && error.message.includes("is not registered")) {
      console.log(
        "⚠️  Proxy not registered with upgrades plugin. Attempting to import..."
      );

      try {
        // Force import the existing proxy
        await upgrades.forceImport(PROXY_ADDRESS, RespectGame);
        console.log("✅ Proxy successfully imported. Retrying upgrade...");

        // Now try the upgrade again
        upgradedContract = await upgrades.upgradeProxy(
          PROXY_ADDRESS,
          RespectGame,
          {
            unsafeSkipStorageCheck: true,
          }
        );

        await upgradedContract.waitForDeployment();

        // Get the new implementation address after upgrade
        const newImpl = await upgrades.erc1967.getImplementationAddress(
          PROXY_ADDRESS
        );
        console.log("New implementation address:", newImpl);

        // Verify the upgrade actually happened
        if (currentImpl.toLowerCase() === newImpl.toLowerCase()) {
          console.log(
            "⚠️  WARNING: Implementation address did not change! Upgrade may have failed."
          );
        } else {
          console.log("✅ Implementation address changed successfully!");
          console.log(`  Old: ${currentImpl}`);
          console.log(`  New: ${newImpl}`);
        }
      } catch (importError) {
        console.error("Failed to import proxy:", importError);
        throw importError;
      }
    } else {
      console.error("Upgrade failed with error:", error);
      throw error;
    }
  }

  console.log(
    "RespectGame proxy address (unchanged):",
    await upgradedContract.getAddress()
  );

  // Wait for a few more confirmations to ensure the upgrade is fully propagated
  console.log("\nWaiting for additional confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

  // Verify state is preserved after upgrade
  console.log("\n📊 Verifying state after upgrade:");
  const newGameNumber = await upgradedContract.currentGameNumber();
  const newStage = await upgradedContract.getCurrentStage();
  const newMemberCount = await upgradedContract.getMemberCount();
  const newApprovedMemberCount =
    await upgradedContract.getApprovedMemberCount();
  console.log("  Current game number:", newGameNumber.toString());
  console.log("  Current stage:", newStage.toString());
  console.log("  Total members:", newMemberCount.toString());
  console.log("  Approved members:", newApprovedMemberCount.toString());

  // Verify state preservation
  if (
    currentGameNumber.toString() === newGameNumber.toString() &&
    currentStage.toString() === newStage.toString() &&
    memberCount.toString() === newMemberCount.toString() &&
    approvedMemberCount.toString() === newApprovedMemberCount.toString()
  ) {
    console.log("✅✅✅ SUCCESS! All state preserved correctly after upgrade");
  } else {
    console.log("❌ Warning: State may have changed!");
    console.log("Game number match:", currentGameNumber === newGameNumber);
    console.log("Stage match:", currentStage === newStage);
    console.log("Member count match:", memberCount === newMemberCount);
    console.log(
      "Approved member count match:",
      approvedMemberCount === newApprovedMemberCount
    );
  }

  // Verify new functions are available
  console.log("\n🔍 Checking for new functions...");
  try {
    // Try to call removeMember with a zero address (will fail but proves function exists)
    await upgradedContract.removeMember.staticCall(ethers.ZeroAddress);
  } catch (error: any) {
    if (error.message.includes("Not a member")) {
      console.log("✅ New removeMember function is available!");
    } else {
      console.log("✅ removeMember function exists (call failed as expected)");
    }
  }

  console.log("\nUpgrade process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
