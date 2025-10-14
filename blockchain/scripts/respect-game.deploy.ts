import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying Respect Game System...");

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

  // ==================== DEPLOY RESPECT GAME ====================

  console.log("\n2. Deploying RespectGame...");
  const RespectGame = await ethers.getContractFactory(
    "RespectGameImplementation"
  );

  // Configuration parameters
  const membersWithoutApproval = 10;
  const periodsForAverage = 12;
  const respectDistribution = [210000, 130000, 80000, 50000, 30000];
  const contributionSubmissionLength = 10 * 60; // 10 minutes in seconds
  const contributionRankingLength = 10 * 60; // 10 minutes in seconds

  // For production, use a proper treasury address
  // For now, use deployer as treasury
  const treasury = deployer.address;

  const respectGame = await upgrades.deployProxy(
    RespectGame,
    [
      deployer.address, // initial owner
      respectTokenAddress, // RESPECT token address
      treasury, // treasury address
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
  await respectGame.waitForDeployment();

  const respectGameAddress = await respectGame.getAddress();
  console.log("RespectGame deployed to:", respectGameAddress);

  // ==================== CONFIGURE PERMISSIONS ====================

  console.log("\n3. Configuring permissions...");

  // Add RespectGame as a minter for RespectToken
  console.log("Adding RespectGame as minter...");
  const addMinterTx = await respectToken.addMinter(respectGameAddress);
  await addMinterTx.wait();
  console.log("RespectGame added as minter");

  // ==================== DEPLOYMENT SUMMARY ====================

  console.log(
    "\n==================== DEPLOYMENT COMPLETE ===================="
  );
  console.log("RespectToken:", respectTokenAddress);
  console.log("RespectGame:", respectGameAddress);
  console.log("Treasury:", treasury);
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
  console.log("\nCurrent game number:", await respectGame.currentGameNumber());
  console.log(
    "Current stage:",
    await respectGame.getCurrentStage(),
    "(0=Submission, 1=Ranking)"
  );
  console.log(
    "Next stage timestamp:",
    await respectGame.getNextStageTimestamp()
  );
  console.log("===========================================================\n");

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    respectToken: respectTokenAddress,
    respectGame: respectGameAddress,
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
