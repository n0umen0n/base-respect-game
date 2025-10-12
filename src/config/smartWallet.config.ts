/**
 * Smart Wallet Configuration
 *
 * Update this file with your Pimlico API key and other settings.
 * Get your API key from: https://dashboard.pimlico.io/
 */

export const SMART_WALLET_CONFIG = {
  // Pimlico API Key - REQUIRED
  // Get this from https://dashboard.pimlico.io/
  PIMLICO_API_KEY: "pim_QLArWNZ7mLYArXrcmBFY5i",

  // Network - Currently set to Base mainnet
  // Change to 'base-sepolia' for testnet
  NETWORK: "base", // Base mainnet

  // Chain ID
  CHAIN_ID: 8453, // Base mainnet
  // CHAIN_ID: 84532, // Base Sepolia (testnet)

  // Pimlico Endpoints (auto-generated from API key and network)
  get BUNDLER_URL() {
    return `https://api.pimlico.io/v2/${this.NETWORK}/rpc?apikey=${this.PIMLICO_API_KEY}`;
  },
  get PAYMASTER_URL() {
    return `https://api.pimlico.io/v2/${this.NETWORK}/rpc?apikey=${this.PIMLICO_API_KEY}`;
  },

  // Entry Point Version - ERC-4337 v0.7
  ENTRY_POINT_VERSION: "0.7" as const,

  // Debug mode - set to true to see detailed logs
  DEBUG: true,
};

/**
 * Validate configuration
 * Call this to check if all required settings are configured
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    !SMART_WALLET_CONFIG.PIMLICO_API_KEY ||
    SMART_WALLET_CONFIG.PIMLICO_API_KEY === "YOUR_PIMLICO_API_KEY"
  ) {
    errors.push(
      "PIMLICO_API_KEY is not set. Please update src/config/smartWallet.config.ts"
    );
  }

  if (SMART_WALLET_CONFIG.DEBUG) {
    console.log("🔧 Smart Wallet Configuration:", {
      network: SMART_WALLET_CONFIG.NETWORK,
      chainId: SMART_WALLET_CONFIG.CHAIN_ID,
      hasApiKey: SMART_WALLET_CONFIG.PIMLICO_API_KEY !== "YOUR_PIMLICO_API_KEY",
      bundlerUrl: SMART_WALLET_CONFIG.BUNDLER_URL.replace(
        SMART_WALLET_CONFIG.PIMLICO_API_KEY,
        "***"
      ),
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
