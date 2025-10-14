import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying RespectGame Executor...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the deployed RespectGame proxy address
  const RESPECT_GAME_PROXY = process.env.RESPECT_GAME_PROXY_ADDRESS;
  if (!RESPECT_GAME_PROXY) {
    throw new Error("RESPECT_GAME_PROXY_ADDRESS not set in environment");
  }

  console.log("RespectGame Proxy:", RESPECT_GAME_PROXY);

  // Deploy Executor with RespectGame as the proposal manager
  const Executor = await ethers.getContractFactory("Executor");
  const executor = await Executor.deploy(RESPECT_GAME_PROXY);
  await executor.waitForDeployment();

  const executorAddress = await executor.getAddress();
  console.log("Executor deployed to:", executorAddress);

  // Set the executor in the RespectGame contract
  const respectGame = await ethers.getContractAt(
    "RespectGameImplementation",
    RESPECT_GAME_PROXY
  );

  console.log("Setting executor in RespectGame...");
  const setExecutorTx = await respectGame.setExecutor(executorAddress);
  await setExecutorTx.wait();
  console.log("Executor set successfully!");

  // Verify the executor was set correctly
  const setExecutorAddress = await respectGame.executor();
  console.log("Executor address in RespectGame:", setExecutorAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Executor:", executorAddress);
  console.log("RespectGame Proxy:", RESPECT_GAME_PROXY);
  console.log(
    "\nTo fund the executor (treasury), send ETH to:",
    executorAddress
  );
  console.log(
    "\nTop 6 members can now create proposals to execute transactions!"
  );
  console.log("Proposals require 4 out of 6 votes to execute.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
