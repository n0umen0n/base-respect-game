/**
 * Smart Contract Addresses
 *
 * These are deployed on Base Sepolia Testnet
 * Contract addresses are public on the blockchain, so it's safe to hardcode them
 *
 * View on BaseScan: https://sepolia.basescan.org/address/{address}
 */

export const CONTRACTS = {
  // Respect Game Core Contract
  RESPECT_GAME_CORE:
    "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29" as `0x${string}`,

  // Respect Token Contract
  RESPECT_TOKEN: "0xef655aA8760d889BB0972903842D8929C80Ba3Fd" as `0x${string}`,

  // Respect Game Governance Contract
  RESPECT_GAME_GOVERNANCE:
    "0x354d6b039f6d463b706a63f18227eb34d4fc93aA" as `0x${string}`,

  // Executor Contract (for proposals)
  EXECUTOR: "0xEe9b38Ee8ddF3ab5F63D1183e6c9Db5640af2B18" as `0x${string}`,

  // Simple Storage Contract (for testing)
  SIMPLE_STORAGE: "0x44aC2daE725b989Df123243A21C9b52b224B4273" as `0x${string}`,

  // USDC on Base Mainnet (for reference)
  USDC_BASE_MAINNET:
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
} as const;

/**
 * Get block explorer URL for a contract
 */
export function getExplorerUrl(address: string): string {
  return `https://sepolia.basescan.org/address/${address}`;
}

/**
 * Get transaction URL on block explorer
 */
export function getTxUrl(txHash: string): string {
  return `https://sepolia.basescan.org/tx/${txHash}`;
}
