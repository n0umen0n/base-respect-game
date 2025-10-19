import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Base Mainnet Token Addresses
const TOKEN_ADDRESSES = {
  WBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC on Base (Coinbase Wrapped BTC)
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', // EURC on Base
} as const;

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface TreasuryBalance {
  symbol: string;
  balance: string;
  rawBalance: bigint;
  decimals: number;
}

export interface TreasuryBalances {
  ETH: TreasuryBalance;
  WBTC: TreasuryBalance;
  EURC: TreasuryBalance;
  USDC: TreasuryBalance;
}

export function useTreasuryBalances(treasuryAddress: string) {
  const [balances, setBalances] = useState<TreasuryBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      try {
        // Only show loading state on initial load, not on refreshes
        if (isInitialLoad) {
          setLoading(true);
        }
        setError(null);

        // Connect to Base Mainnet (using Alchemy RPC)
        const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9');

        // Fetch ETH balance (should always work)
        const ethBalance = await provider.getBalance(treasuryAddress);
        const ethFormatted = ethers.formatEther(ethBalance);

        // Fetch token balances with individual error handling and fallback symbols
        const wbtcBalance = await fetchTokenBalance(
          provider,
          TOKEN_ADDRESSES.WBTC,
          treasuryAddress,
          'cbBTC'
        ).catch((err) => {
          console.warn('Failed to fetch cbBTC balance:', err.message);
          return getDefaultBalance('cbBTC');
        });

        const usdcBalance = await fetchTokenBalance(
          provider,
          TOKEN_ADDRESSES.USDC,
          treasuryAddress,
          'USDC'
        ).catch((err) => {
          console.warn('Failed to fetch USDC balance:', err.message);
          return getDefaultBalance('USDC');
        });

        const eurcBalance = await fetchTokenBalance(
          provider,
          TOKEN_ADDRESSES.EURC,
          treasuryAddress,
          'EURC'
        ).catch((err) => {
          console.warn('Failed to fetch EURC balance:', err.message);
          return getDefaultBalance('EURC');
        });

        setBalances({
          ETH: {
            symbol: 'ETH',
            balance: parseFloat(ethFormatted).toFixed(4),
            rawBalance: ethBalance,
            decimals: 18,
          },
          WBTC: wbtcBalance,
          EURC: eurcBalance,
          USDC: usdcBalance,
        });
      } catch (err: any) {
        console.error('Error fetching treasury balances:', err);
        // Only set error if we couldn't fetch anything at all
        setError('Unable to connect to blockchain');
        // Set default balances on complete failure if no balances exist yet
        setBalances((prevBalances) => {
          if (!prevBalances) {
            return {
              ETH: getDefaultBalance('ETH'),
              WBTC: getDefaultBalance('cbBTC'),
              EURC: getDefaultBalance('EURC'),
              USDC: getDefaultBalance('USDC'),
            };
          }
          return prevBalances;
        });
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchBalances();
  }, [treasuryAddress]);

  return { balances, loading, error };
}

async function fetchTokenBalance(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  ownerAddress: string,
  fallbackSymbol?: string
): Promise<TreasuryBalance> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // Fetch balance and decimals first
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(ownerAddress),
    contract.decimals(),
  ]);

  // Try to fetch symbol, use fallback if it fails
  let symbol = fallbackSymbol || 'TOKEN';
  try {
    symbol = await contract.symbol();
  } catch (err) {
    console.warn(`Could not fetch symbol for ${tokenAddress}, using fallback: ${fallbackSymbol}`);
  }

  const formatted = ethers.formatUnits(balance, decimals);

  return {
    symbol,
    balance: parseFloat(formatted).toFixed(decimals > 6 ? 6 : 2),
    rawBalance: balance,
    decimals: Number(decimals),
  };
}

function getDefaultBalance(symbol: string): TreasuryBalance {
  return {
    symbol,
    balance: '0.00',
    rawBalance: 0n,
    decimals: symbol === 'ETH' ? 18 : symbol === 'cbBTC' ? 8 : 6,
  };
}

