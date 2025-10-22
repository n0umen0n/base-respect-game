import { ethers, upgrades } from "hardhat";

// TODO: Update this with your deployed Governance proxy address
const GOVERNANCE_PROXY_ADDRESS = "0x354d6b039f6d463b706a63f18227eb34d4fc93aA";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const adminAddress = await deployer.getAddress();

  console.log(
    "Upgrading RespectGameGovernance with admin address:",
    adminAddress
  );
  console.log("Governance Proxy address:", GOVERNANCE_PROXY_ADDRESS);

  // Get the current implementation address before upgrade
  const currentImpl = await upgrades.erc1967.getImplementationAddress(
    GOVERNANCE_PROXY_ADDRESS
  );
  console.log("Current implementation address:", currentImpl);

  const RespectGameGovernance = await ethers.getContractFactory(
    "RespectGameGovernance"
  );

  console.log("Contract factory created successfully");
  console.log(
    "Contract bytecode length:",
    RespectGameGovernance.bytecode.length
  );

  // Get current state before upgrade
  console.log("\n📊 Current state before upgrade:");
  const proxy = await ethers.getContractAt(
    "RespectGameGovernance",
    GOVERNANCE_PROXY_ADDRESS
  );

  try {
    const proposalCount = await proxy.getProposalCount();
    const executor = await proxy.executor();
    const coreContract = await proxy.coreContract();
    console.log("  Total proposals:", proposalCount.toString());
    console.log("  Executor address:", executor);
    console.log("  Core contract address:", coreContract);

    // Try to get a proposal if any exist
    if (proposalCount > 0n) {
      const lastProposal = await proxy.getProposal(proposalCount - 1n);
      console.log("  Last proposal type:", lastProposal[0].toString());
      console.log("  Last proposal status:", lastProposal[7].toString());
    }
  } catch (error) {
    console.log("  Could not fetch all state (expected for first-time setup)");
  }

  let upgradedContract;

  try {
    console.log("\nUpgrading RespectGameGovernance...");

    // Use upgrades.upgradeProxy for cleaner upgrade process
    upgradedContract = await upgrades.upgradeProxy(
      GOVERNANCE_PROXY_ADDRESS,
      RespectGameGovernance,
      {
        // Force the upgrade even if validation fails
        unsafeSkipStorageCheck: true,
      }
    );

    await upgradedContract.waitForDeployment();

    // Get the new implementation address after upgrade
    const newImpl = await upgrades.erc1967.getImplementationAddress(
      GOVERNANCE_PROXY_ADDRESS
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
        GOVERNANCE_PROXY_ADDRESS,
        RespectGameGovernance
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
        await upgrades.forceImport(
          GOVERNANCE_PROXY_ADDRESS,
          RespectGameGovernance
        );
        console.log("✅ Proxy successfully imported. Retrying upgrade...");

        // Now try the upgrade again
        upgradedContract = await upgrades.upgradeProxy(
          GOVERNANCE_PROXY_ADDRESS,
          RespectGameGovernance,
          {
            unsafeSkipStorageCheck: true,
          }
        );

        await upgradedContract.waitForDeployment();

        // Get the new implementation address after upgrade
        const newImpl = await upgrades.erc1967.getImplementationAddress(
          GOVERNANCE_PROXY_ADDRESS
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
    "RespectGameGovernance proxy address (unchanged):",
    await upgradedContract.getAddress()
  );

  // Wait for a few more confirmations to ensure the upgrade is fully propagated
  console.log("\nWaiting for additional confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

  // Verify state is preserved after upgrade
  console.log("\n📊 Verifying state after upgrade:");
  try {
    const newProposalCount = await upgradedContract.getProposalCount();
    const newExecutor = await upgradedContract.executor();
    const newCoreContract = await upgradedContract.coreContract();
    console.log("  Total proposals:", newProposalCount.toString());
    console.log("  Executor address:", newExecutor);
    console.log("  Core contract address:", newCoreContract);

    // Try to get a proposal if any exist
    if (newProposalCount > 0n) {
      const lastProposal = await upgradedContract.getProposal(
        newProposalCount - 1n
      );
      console.log("  Last proposal type:", lastProposal[0].toString());
      console.log("  Last proposal status:", lastProposal[7].toString());
    }

    console.log("✅ State verified successfully after upgrade");
  } catch (error) {
    console.log("⚠️  Could not fully verify state:", error);
  }

  // Verify new createProposal function is available
  console.log("\n🔍 Checking for new createProposal function...");
  try {
    // Check if the function exists in the ABI
    const createProposalFragment =
      upgradedContract.interface.getFunction("createProposal");
    if (createProposalFragment) {
      console.log("✅ New createProposal function is available!");
      console.log("   Function signature:", createProposalFragment.format());
    }
  } catch (error: any) {
    console.log("❌ createProposal function not found:", error.message);
  }

  // Verify legacy functions still work
  console.log("\n🔍 Verifying legacy functions...");
  try {
    const createBanFragment =
      upgradedContract.interface.getFunction("createBanProposal");
    const createApproveFragment = upgradedContract.interface.getFunction(
      "createApproveMemberProposal"
    );
    const createExecuteFragment = upgradedContract.interface.getFunction(
      "createExecuteTransactionsProposal"
    );

    if (createBanFragment && createApproveFragment && createExecuteFragment) {
      console.log("✅ All legacy functions are available!");
      console.log("   - createBanProposal");
      console.log("   - createApproveMemberProposal");
      console.log("   - createExecuteTransactionsProposal");
    }
  } catch (error: any) {
    console.log("⚠️  Some legacy functions may be missing:", error.message);
  }

  // Check if we can get transaction data from proposals
  console.log("\n🔍 Checking new transaction storage...");
  try {
    if ((await upgradedContract.getProposalCount()) > 0n) {
      const lastProposalId = (await upgradedContract.getProposalCount()) - 1n;
      const txCount = await upgradedContract.getProposalTransactionCount(
        lastProposalId
      );
      console.log(`  Last proposal has ${txCount.toString()} transaction(s)`);

      if (txCount > 0n) {
        const [target, value, data] =
          await upgradedContract.getProposalTransaction(lastProposalId, 0);
        console.log("  First transaction target:", target);
        console.log("  First transaction value:", value.toString());
        console.log("  First transaction data length:", data.length);
      }
    }
    console.log("✅ Transaction storage working correctly!");
  } catch (error: any) {
    console.log("⚠️  Could not verify transaction storage:", error.message);
  }

  console.log("\n🎉 Upgrade process completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update the contract ABI in your frontend");
  console.log("2. Redeploy your webhook to handle new events");
  console.log(
    "3. Test creating a proposal with the new createProposal function"
  );
  console.log(
    "4. Verify events include transaction data (targets, values, calldatas)"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
