import { useState, useEffect, useMemo, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { SMART_WALLET_CONFIG, validateConfig } from '../config/smartWallet.config';

// Global singleton to prevent duplicate smart wallet setups across all hook instances
const globalWalletCache: {
  setupInProgress: boolean;
  lastWalletAddress: string | null;
  smartAccountClient: any;
  smartAccountAddress: string | null;
} = {
  setupInProgress: false,
  lastWalletAddress: null,
  smartAccountClient: null,
  smartAccountAddress: null,
};

export function useSmartWallet(enabled: boolean = true) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccountClient, setSmartAccountClient] = useState<any>(globalWalletCache.smartAccountClient);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(globalWalletCache.smartAccountAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the embedded wallet
  const embeddedWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.walletClientType === 'privy');
  }, [wallets]);

  // Sync local state with global cache on mount and when cache updates
  useEffect(() => {
    if (globalWalletCache.smartAccountClient && globalWalletCache.smartAccountAddress) {
      setSmartAccountClient(globalWalletCache.smartAccountClient);
      setSmartAccountAddress(globalWalletCache.smartAccountAddress);
    }
  }, []);

  useEffect(() => {
    // Don't initialize if not enabled
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Handle polling if setup is already in progress
    if (!ready || !authenticated || !embeddedWallet) {
      // Clear local state
      setSmartAccountClient(null);
      setSmartAccountAddress(null);
      // Clear global cache
      globalWalletCache.setupInProgress = false;
      globalWalletCache.lastWalletAddress = null;
      globalWalletCache.smartAccountClient = null;
      globalWalletCache.smartAccountAddress = null;
      return;
    }

    // If already set up for this wallet, use cached values immediately
    if (globalWalletCache.lastWalletAddress === embeddedWallet.address && globalWalletCache.smartAccountClient) {
      console.log('✅ Using cached smart wallet:', globalWalletCache.smartAccountAddress);
      setSmartAccountClient(globalWalletCache.smartAccountClient);
      setSmartAccountAddress(globalWalletCache.smartAccountAddress);
      setIsLoading(false);
      return;
    }

    // If setup is in progress by another instance, poll for completion
    if (globalWalletCache.setupInProgress) {
      console.log('⏳ Smart wallet setup already in progress, waiting...');
      setIsLoading(true);
      
      // Poll for completion
      const checkInterval = setInterval(() => {
        if (!globalWalletCache.setupInProgress && globalWalletCache.smartAccountClient) {
          console.log('✅ Smart wallet setup completed by another instance');
          setSmartAccountClient(globalWalletCache.smartAccountClient);
          setSmartAccountAddress(globalWalletCache.smartAccountAddress);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 50); // Check every 50ms
      
      // Cleanup
      return () => {
        clearInterval(checkInterval);
      };
    }

    // Setup the smart wallet
    async function setupSmartWallet() {
      // Safety check
      if (!embeddedWallet) {
        console.error('❌ No embedded wallet found');
        return;
      }

      // Set flag IMMEDIATELY in global cache to prevent race conditions
      globalWalletCache.setupInProgress = true;

      try {
        setIsLoading(true);
        setError(null);

        // Validate configuration
        const configValidation = validateConfig();
        if (!configValidation.valid) {
          throw new Error(
            'Smart Wallet Configuration Error:\n' + 
            configValidation.errors.join('\n') +
            '\n\nPlease update src/config/smartWallet.config.ts with your Pimlico API key.'
          );
        }

        // Get the EIP-1193 provider from the Privy embedded wallet
        const provider = await embeddedWallet.getEthereumProvider();

        // Determine which chain to use based on config
        const currentChain = SMART_WALLET_CONFIG.CHAIN_ID === 84532 ? baseSepolia : base;
        console.log('🌐 Using chain:', currentChain.name, 'Chain ID:', currentChain.id);

        // Use Alchemy RPC to avoid rate limits
        const alchemyRpcUrl = currentChain.id === 8453 
          ? 'https://base-mainnet.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9'
          : 'https://base-sepolia.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9';

        // Create a public client for RPC calls with Alchemy endpoint
        const publicClient = createPublicClient({
          chain: currentChain,
          transport: http(alchemyRpcUrl),
        });

        // Create a wallet client from the embedded wallet
        const walletClient = createWalletClient({
          account: embeddedWallet.address as `0x${string}`,
          chain: currentChain,
          transport: custom(provider),
        });

        console.log('🔧 Creating smart account with embedded wallet as signer...');

        // Create a simple smart account with the embedded wallet as the signer
        const simpleSmartAccount = await toSimpleSmartAccount({
          client: publicClient,
          owner: walletClient,
          entryPoint: {
            address: entryPoint07Address,
            version: '0.7',
          },
        });

        console.log('🎯 Smart Account Address:', simpleSmartAccount.address);

        // Create Pimlico paymaster client for gas sponsorship
        console.log('💰 Setting up Pimlico paymaster...');
        const pimlicoClient = createPimlicoClient({
          transport: http(SMART_WALLET_CONFIG.PAYMASTER_URL),
          entryPoint: {
            address: entryPoint07Address,
            version: '0.7',
          },
        });

        // Create the smart account client with paymaster
        const smartClient = createSmartAccountClient({
          account: simpleSmartAccount,
          chain: currentChain,
          bundlerTransport: http(SMART_WALLET_CONFIG.BUNDLER_URL),
          paymaster: pimlicoClient,
          userOperation: {
            estimateFeesPerGas: async () => {
              const gasPrice = await pimlicoClient.getUserOperationGasPrice();
              return gasPrice.fast;
            },
          },
        });

        // Update both local state and global cache
        setSmartAccountClient(smartClient);
        setSmartAccountAddress(simpleSmartAccount.address);
        globalWalletCache.smartAccountClient = smartClient;
        globalWalletCache.smartAccountAddress = simpleSmartAccount.address;
        globalWalletCache.lastWalletAddress = embeddedWallet.address;
        console.log('✅ Smart wallet setup complete!');
      } catch (err) {
        console.error('❌ Error setting up smart wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup smart wallet');
        // Clear cache on error
        globalWalletCache.lastWalletAddress = null;
        globalWalletCache.smartAccountClient = null;
        globalWalletCache.smartAccountAddress = null;
      } finally {
        setIsLoading(false);
        globalWalletCache.setupInProgress = false;
      }
    }

    setupSmartWallet();
  }, [ready, authenticated, embeddedWallet, enabled]);

  return {
    smartAccountClient,
    smartAccountAddress,
    embeddedWallet,
    isLoading,
    error,
    isReady: ready && authenticated && !!smartAccountClient,
  };
}

