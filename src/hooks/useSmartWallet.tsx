import { useState, useEffect, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { SMART_WALLET_CONFIG, validateConfig } from '../config/smartWallet.config';

export function useSmartWallet() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccountClient, setSmartAccountClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the embedded wallet
  const embeddedWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.walletClientType === 'privy');
  }, [wallets]);

  useEffect(() => {
    async function setupSmartWallet() {
      if (!ready || !authenticated || !embeddedWallet) {
        setSmartAccountClient(null);
        setSmartAccountAddress(null);
        return;
      }

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

        // Create a public client for RPC calls
        const publicClient = createPublicClient({
          chain: currentChain,
          transport: http(),
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
        setSmartAccountAddress(simpleSmartAccount.address);

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

        setSmartAccountClient(smartClient);
        console.log('✅ Smart wallet setup complete!');
      } catch (err) {
        console.error('❌ Error setting up smart wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup smart wallet');
      } finally {
        setIsLoading(false);
      }
    }

    setupSmartWallet();
  }, [ready, authenticated, embeddedWallet]);

  return {
    smartAccountClient,
    smartAccountAddress,
    embeddedWallet,
    isLoading,
    error,
    isReady: ready && authenticated && !!smartAccountClient,
  };
}

