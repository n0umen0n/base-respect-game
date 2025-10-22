import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Helper script to find the Governance proxy address
 * Looks in .openzeppelin files and deployment records
 */
async function main() {
  console.log("🔍 Looking for RespectGameGovernance proxy address...\n");

  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = network.chainId.toString();

  console.log("Network:", networkName);
  console.log("Chain ID:", chainId);
  console.log("");

  // Check .openzeppelin directory
  const openzeppelinDir = path.join(__dirname, "..", ".openzeppelin");

  if (fs.existsSync(openzeppelinDir)) {
    console.log("📁 Checking .openzeppelin directory...");

    const files = fs.readdirSync(openzeppelinDir);
    const networkFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of networkFiles) {
      console.log(`  Checking ${file}...`);
      const filePath = path.join(openzeppelinDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Look for governance proxies
      if (content.proxies) {
        for (const [address, proxyInfo] of Object.entries(content.proxies)) {
          const info = proxyInfo as any;
          if (
            info.kind === "uups" &&
            (address.includes("Governance") ||
              info.address?.toLowerCase().includes("governance"))
          ) {
            console.log("\n✅ Found potential Governance proxy:");
            console.log("   Address:", address);
            console.log("   Kind:", info.kind);
            if (info.address) console.log("   Proxy Address:", info.address);
          }
        }
      }

      // Also check impls
      if (content.impls) {
        for (const [implAddress, implInfo] of Object.entries(content.impls)) {
          const info = implInfo as any;
          if (
            info.layout?.types?.["RespectGameGovernance"] ||
            info.contractName === "RespectGameGovernance"
          ) {
            console.log("\n📦 Found Governance implementation:");
            console.log("   Implementation Address:", implAddress);
            console.log(
              "   Contract:",
              info.contractName || "RespectGameGovernance"
            );
          }
        }
      }
    }
  } else {
    console.log("⚠️  .openzeppelin directory not found");
  }

  // Check if there's a deployments file or similar
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (fs.existsSync(deploymentsPath)) {
    console.log("\n📁 Checking deployments.json...");
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    if (deployments.governance || deployments.RespectGameGovernance) {
      console.log("✅ Found in deployments:");
      console.log(deployments.governance || deployments.RespectGameGovernance);
    }
  }

  // Try to find from contract addresses config
  const configPath = path.join(
    __dirname,
    "..",
    "..",
    "src",
    "config",
    "contracts.config.ts"
  );
  if (fs.existsSync(configPath)) {
    console.log("\n📁 Checking contracts.config.ts...");
    const configContent = fs.readFileSync(configPath, "utf8");

    const governanceMatch = configContent.match(
      /RESPECT_GAME_GOVERNANCE[:\s=]+['"]?(0x[a-fA-F0-9]{40})['"]?/
    );
    if (governanceMatch) {
      console.log("✅ Found in config:");
      console.log("   Governance Address:", governanceMatch[1]);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("💡 If you found your governance address above, update it in:");
  console.log("   blockchain/scripts/governance.manual-upgrade.ts");
  console.log("   at line 4: const GOVERNANCE_PROXY_ADDRESS = '0x...'");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
