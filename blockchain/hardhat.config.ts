import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const BASE_MAINNET_PRIVATE_KEY = process.env.BASE_MAINNET_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Aggressive optimization for smallest size
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true, // Allow larger contracts in testing
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
    "base-mainnet": {
      url:
        process.env.BASE_MAINNET_RPC_URL ||
        "https://base-mainnet.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9",
      accounts: BASE_MAINNET_PRIVATE_KEY ? [BASE_MAINNET_PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};

export default config;
