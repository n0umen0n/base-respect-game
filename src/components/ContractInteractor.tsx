import React, { useState, useEffect } from 'react';
import { isAddress, encodeFunctionData, createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { SMART_WALLET_CONFIG } from '../config/smartWallet.config';

// The ABI for the SimpleStorageImplementation contract, formatted for viem
const contractABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_number',
        type: 'uint256',
      },
    ],
    name: 'setNumber',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNumber',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// The address of your deployed SimpleStorage contract
const contractAddress = '0x44aC2daE725b989Df123243A21C9b52b224B4273';

interface ContractInteractorProps {
    wallet: any;
}

export default function ContractInteractor({ wallet }: ContractInteractorProps) {
  const [number, setNumber] = useState('');
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [isLoadingNumber, setIsLoadingNumber] = useState(false);
  
  const { 
    smartAccountClient, 
    smartAccountAddress, 
    embeddedWallet,
    isLoading: isSmartWalletLoading, 
    error: smartWalletError,
    isReady: isSmartWalletReady 
  } = useSmartWallet();
  
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | number | null>(null);

  useEffect(() => {
    if (wallet?.chainId) {
      setCurrentChainId(wallet.chainId);
    }
  }, [wallet?.chainId]);

  // Auto-fetch the current number on mount
  useEffect(() => {
    if (isSmartWalletReady) {
      handleGetNumber();
    }
  }, [isSmartWalletReady]);

  const switchToBase = async () => {
    if (!wallet.switchChain) {
      alert('Network switching is not supported by this wallet');
      return false;
    }

    setIsSwitchingNetwork(true);
    try {
      await wallet.switchChain(base.id); // Base mainnet chain ID: 8453
      console.log('✅ Switched to Base network');
      setCurrentChainId(base.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to switch network:', error);
      alert('Failed to switch to Base network. Please switch manually in your wallet.');
      return false;
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const parseChainId = (chainId: string | number | null | undefined): number | null => {
    if (!chainId) return null;
    
    if (typeof chainId === 'number') return chainId;
    
    // Handle CAIP-2 format (e.g., 'eip155:8453')
    if (typeof chainId === 'string') {
      if (chainId.includes(':')) {
        const parts = chainId.split(':');
        return parseInt(parts[parts.length - 1], 10);
      }
      // Handle hex format (e.g., '0x2105')
      if (chainId.startsWith('0x')) {
        return parseInt(chainId, 16);
      }
      // Handle decimal string
      return parseInt(chainId, 10);
    }
    
    return null;
  };

  const handleSendTransaction = async () => {
    if (!isAddress(contractAddress)) {
      alert(
        "Please replace 'YOUR_CONTRACT_ADDRESS' with your contract's deployed address."
      );
      return;
    }

    // Check if smart wallet is ready
    if (!isSmartWalletReady || !smartAccountClient) {
      alert('Smart wallet is not ready yet. Please wait...');
      return;
    }

    if (smartWalletError) {
      alert(`Smart wallet error: ${smartWalletError}`);
      return;
    }
    
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);

    try {
        console.log('🚀 Sending sponsored transaction via Smart Wallet:', {
            smartAccountAddress,
            contractAddress,
            functionName: 'setNumber',
            args: [BigInt(number)],
        });
        
        // Send transaction using the smart account client with paymaster
        const userOpHash = await smartAccountClient.writeContract({
            address: contractAddress as `0x${string}`,
            abi: contractABI,
            functionName: 'setNumber',
            args: [BigInt(number)],
        });
        
        console.log('📝 User Operation Hash:', userOpHash);
        console.log('🔍 Check status at: https://jiffyscan.xyz/userOpHash/' + userOpHash + '?network=base');
        
        // Wait for the user operation to be included in a block
        console.log('⏳ Waiting for transaction confirmation (up to 2 minutes)...');
        const receipt = await smartAccountClient.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: 120_000, // 2 minutes timeout (increased from default)
            pollingInterval: 2_000, // Check every 2 seconds
        });
        
        console.log('✅ Transaction successful! Receipt:', receipt);
        
        // Extract transaction hash from receipt
        const txHash = receipt.receipt.transactionHash;
        if (txHash) setTxHash(txHash);
        setIsSuccess(true);
        
        // Auto-fetch the new number after successful transaction
        setTimeout(() => {
          handleGetNumber();
        }, 1000); // Wait 1 second for the chain to update
    } catch (e: any) {
        console.error('❌ Transaction failed:', e);
        console.error('Error details:', {
            message: e?.message,
            code: e?.code,
            reason: e?.reason,
            cause: e?.cause,
        });
        
        // Provide helpful error messages
        let errorMessage = e?.message || 'Transaction failed';
        
        if (e?.message?.includes('Timed out while waiting')) {
            // Extract user op hash from error message if available
            const hashMatch = e?.message?.match(/0x[a-fA-F0-9]{64}/);
            const userOpHash = hashMatch ? hashMatch[0] : null;
            
            errorMessage = '⏱️ Transaction is taking longer than expected.\n\n';
            
            if (userOpHash) {
                errorMessage += `Your transaction was submitted successfully but is still pending.\n\n`;
                errorMessage += `User Operation Hash:\n${userOpHash}\n\n`;
                errorMessage += `Check status at:\nhttps://jiffyscan.xyz/userOpHash/${userOpHash}?network=base\n\n`;
                errorMessage += `If the transaction shows as "Success" on JiffyScan, try refreshing this page.`;
            } else {
                errorMessage += 'The transaction may still be processing. Check back in a few minutes.';
            }
        } else if (e?.message?.includes('paymaster')) {
            errorMessage = '⚠️ Paymaster error: Check your Pimlico API key and ensure the paymaster is properly configured.\n\n';
            errorMessage += 'Make sure you have enabled the Free Tier or added credits in your Pimlico dashboard:\n';
            errorMessage += 'https://dashboard.pimlico.io/billing';
        } else if (e?.message?.includes('bundler')) {
            errorMessage = '⚠️ Bundler error: Check your bundler configuration.';
        } else if (e?.message?.includes('insufficient') || e?.message?.includes('Insufficient')) {
            errorMessage = '⚠️ Insufficient Pimlico balance for gas sponsorship.\n\n';
            errorMessage += 'Solutions:\n';
            errorMessage += '1. Enable Free Tier (50,000 ops/month): https://dashboard.pimlico.io/billing\n';
            errorMessage += '2. Or add credits to your Pimlico account';
        }
        
        setError(new Error(errorMessage));
        setIsError(true);
    } finally {
        setIsPending(false);
    }
  };

  const isOnBaseNetwork = () => {
    const chainIdNum = parseChainId(currentChainId);
    return chainIdNum === 8453;
  };

  const handleGetNumber = async () => {
    setIsLoadingNumber(true);
    try {
      console.log('📖 Reading number from contract...');
      
      // Create a public client for reading (no wallet needed for view functions)
      const currentChain = SMART_WALLET_CONFIG.CHAIN_ID === 84532 ? baseSepolia : base;
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });
      
      // Read from contract using the public client
      const result = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'getNumber',
      });
      
      console.log('✅ Current number on-chain:', result.toString());
      setCurrentNumber(result.toString());
    } catch (e: any) {
      console.error('❌ Failed to read number:', e);
      setCurrentNumber('Error: ' + (e?.message || 'Failed to read'));
    } finally {
      setIsLoadingNumber(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-gray-800 mt-8">
      <h2 className="text-xl font-bold mb-2">Interact with Smart Contract (Smart Wallet + Paymaster)</h2>
      
      {/* Smart Wallet Status */}
      {isSmartWalletLoading && (
        <div className="mb-3 p-2 rounded-lg text-sm bg-blue-100 text-blue-800">
          <span>🔄 Setting up smart wallet...</span>
        </div>
      )}
      
      {smartWalletError && (
        <div className="mb-3 p-2 rounded-lg text-sm bg-red-100 text-red-800">
          <span>❌ Smart Wallet Error: {smartWalletError}</span>
        </div>
      )}

      {isSmartWalletReady && smartAccountAddress && (
        <div className="mb-3 p-2 rounded-lg text-sm bg-green-100 text-green-800">
          <p className="font-semibold">✅ Smart Wallet Ready</p>
          <p className="text-xs mt-1 break-all">
            Address: {smartAccountAddress}
          </p>
          <p className="text-xs mt-1">
            Signer: {embeddedWallet?.address.slice(0, 6)}...{embeddedWallet?.address.slice(-4)}
          </p>
        </div>
      )}

      {/* Current Number Display */}
      <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Current Number On-Chain:</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {currentNumber !== null ? currentNumber : '---'}
            </p>
          </div>
          <button
            onClick={handleGetNumber}
            disabled={isLoadingNumber}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
          >
            {isLoadingNumber ? '🔄 Loading...' : '🔍 Get Number'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click "Get Number" to check the current value stored in the contract
        </p>
      </div>

      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="Enter a number"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
      />
      <button
        onClick={handleSendTransaction}
        disabled={!number || isPending || !isSmartWalletReady || isSmartWalletLoading}
        className="w-full px-4 py-2 mt-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSmartWalletLoading 
          ? 'Setting up Smart Wallet...' 
          : isPending 
          ? 'Sending Sponsored Transaction...' 
          : 'Set Number (Gas Sponsored via Paymaster)'}
      </button>
      {isSuccess && (
        <div className="mt-2 text-sm text-green-600">
          <p className="font-semibold">✅ Transaction successful!</p>
          {txHash && (
            <a 
              href={SMART_WALLET_CONFIG.CHAIN_ID === 84532 
                ? `https://sepolia.basescan.org/tx/${txHash}`
                : `https://basescan.org/tx/${txHash}`
              } 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-green-700"
            >
              View on BaseScan {SMART_WALLET_CONFIG.CHAIN_ID === 84532 && '(Sepolia)'}
            </a>
          )}
        </div>
      )}
       {isError && (
        <div className="mt-2 text-sm text-red-600">
          <p className="font-semibold">❌ Transaction failed:</p>
          <p className="whitespace-pre-wrap">{error?.message || 'An unknown error occurred.'}</p>
        </div>
      )}
    </div>
  );
}
