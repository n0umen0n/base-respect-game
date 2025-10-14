import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying Respect Game System (Split Architecture)...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // ==================== DEPLOY RESPECT TOKEN ====================

  console.log("\n1. Deploying RespectToken...");
  const RespectToken = await ethers.getContractFactory("RespectToken");

  const respectToken = await upgrades.deployProxy(
    RespectToken,
    [
      deployer.address, // initial owner
      "RESPECT", // token name
      "RESPECT", // token symbol
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await respectToken.waitForDeployment();

  const respectTokenAddress = await respectToken.getAddress();
  console.log("RespectToken deployed to:", respectTokenAddress);

  // ==================== DEPLOY EXECUTOR ====================

  console.log("\n2. Deploying Executor...");
  const Executor = await ethers.getContractFactory("Executor");

  // Deploy with temporary proposal manager (will be set to governance later)
  const executor = await Executor.deploy(deployer.address);
  await executor.waitForDeployment();

  const executorAddress = await executor.getAddress();
  console.log("Executor deployed to:", executorAddress);

  // ==================== DEPLOY RESPECT GAME CORE ====================

  console.log("\n3. Deploying RespectGameCore...");
  const RespectGameCore = await ethers.getContractFactory("RespectGameCore");

  // Configuration parameters
  const membersWithoutApproval = 10;
  const periodsForAverage = 12;
  const respectDistribution = [210000, 130000, 80000, 50000, 30000];
  const contributionSubmissionLength = 10 * 60; // 10 minutes in seconds
  const contributionRankingLength = 10 * 60; // 10 minutes in seconds

  // For production, use a proper treasury address
  // For now, use deployer as treasury (deprecated - executor will handle treasury)
  const treasury = deployer.address;

  const respectGameCore = await upgrades.deployProxy(
    RespectGameCore,
    [
      deployer.address, // initial owner
      respectTokenAddress, // RESPECT token address
      treasury, // treasury address (deprecated)
      membersWithoutApproval, // first 10 members join without approval
      periodsForAverage, // 12 periods for average calculation
      respectDistribution, // RESPECT distribution array
      contributionSubmissionLength, // 10 minutes for contribution submission
      contributionRankingLength, // 10 minutes for ranking
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await respectGameCore.waitForDeployment();

  const respectGameCoreAddress = await respectGameCore.getAddress();
  console.log("RespectGameCore deployed to:", respectGameCoreAddress);

  // ==================== DEPLOY RESPECT GAME GOVERNANCE ====================

  console.log("\n4. Deploying RespectGameGovernance...");
  const RespectGameGovernance = await ethers.getContractFactory(
    "RespectGameGovernance"
  );

  const respectGameGovernance = await upgrades.deployProxy(
    RespectGameGovernance,
    [
      deployer.address, // initial owner
      respectGameCoreAddress, // core contract address
      executorAddress, // executor contract address
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  await respectGameGovernance.waitForDeployment();

  const respectGameGovernanceAddress = await respectGameGovernance.getAddress();
  console.log(
    "RespectGameGovernance deployed to:",
    respectGameGovernanceAddress
  );

  // ==================== CONFIGURE PERMISSIONS ====================

  console.log("\n5. Configuring permissions...");

  // Add RespectGameCore as a minter for RespectToken
  console.log("Adding RespectGameCore as minter...");
  const addMinterTx = await respectToken.addMinter(respectGameCoreAddress);
  await addMinterTx.wait();
  console.log("RespectGameCore added as minter");

  // Set governance contract in core
  console.log("Setting governance contract in core...");
  const setGovernanceTx = await respectGameCore.setGovernanceContract(
    respectGameGovernanceAddress
  );
  await setGovernanceTx.wait();
  console.log("Governance contract set in core");

  // Set governance as proposal manager in executor
  console.log("Setting governance as proposal manager...");
  const setProposalManagerTx = await executor.setProposalManager(
    respectGameGovernanceAddress
  );
  await setProposalManagerTx.wait();
  console.log("Governance set as proposal manager");
  console.log(
    "Note: Executor ownership remains with deployer for admin purposes"
  );

  // ==================== DEPLOYMENT SUMMARY ====================

  console.log(
    "\n==================== DEPLOYMENT COMPLETE ===================="
  );
  console.log("RespectToken:", respectTokenAddress);
  console.log("Executor:", executorAddress);
  console.log("RespectGameCore:", respectGameCoreAddress);
  console.log("RespectGameGovernance:", respectGameGovernanceAddress);
  console.log("Treasury (deprecated):", treasury);
  console.log("\nConfiguration:");
  console.log("- Members without approval:", membersWithoutApproval);
  console.log("- Periods for average:", periodsForAverage);
  console.log("- RESPECT distribution:", respectDistribution);
  console.log(
    "- Contribution submission length:",
    contributionSubmissionLength,
    "seconds"
  );
  console.log(
    "- Contribution ranking length:",
    contributionRankingLength,
    "seconds"
  );
  console.log(
    "\nCurrent game number:",
    await respectGameCore.currentGameNumber()
  );
  console.log(
    "Current stage:",
    await respectGameCore.getCurrentStage(),
    "(0=Submission, 1=Ranking)"
  );
  console.log(
    "Next stage timestamp:",
    await respectGameCore.getNextStageTimestamp()
  );
  console.log("===========================================================\n");

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    respectToken: respectTokenAddress,
    executor: executorAddress,
    respectGameCore: respectGameCoreAddress,
    respectGameGovernance: respectGameGovernanceAddress,
    treasury: treasury,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    configuration: {
      membersWithoutApproval,
      periodsForAverage,
      respectDistribution,
      contributionSubmissionLength,
      contributionRankingLength,
    },
  };

  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
