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

// USDC ABI (just the transfer function)
const usdcABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// The address of your deployed SimpleStorage contract
const contractAddress = '0x44aC2daE725b989Df123243A21C9b52b224B4273';

// USDC contract address on Base mainnet
const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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
    setTxHash(null);

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
        
        console.log('✅ Transaction submitted successfully!');
        console.log('📝 User Operation Hash:', userOpHash);
        
        // 🎯 OPTIMISTIC SUCCESS: Show success immediately after submission
        // This matches what Privy's modal shows
        setIsSuccess(true);
        setIsPending(false);
        setTxHash(userOpHash); // Show the userOp hash immediately
        
        // Auto-refresh the number optimistically
        setTimeout(() => {
          handleGetNumber();
        }, 2000); // Wait 2 seconds for chain to update
        
        // 🔄 BACKGROUND POLLING: Try to get the final receipt in the background
        // This doesn't block the UI
        (async () => {
          try {
            console.log('⏳ Polling for final receipt in background...');
            const receipt = await smartAccountClient.waitForUserOperationReceipt({
                hash: userOpHash,
                timeout: 60_000, // 1 minute timeout
                pollingInterval: 3_000, // Check every 3 seconds
            });
            
            console.log('✅ Receipt confirmed! Final receipt:', receipt);
            
            // Update with the actual transaction hash if different
            const actualTxHash = receipt.receipt.transactionHash;
            if (actualTxHash) {
              setTxHash(actualTxHash);
              console.log('🔗 Final transaction hash:', actualTxHash);
            }
            
            // Fetch the updated number one more time
            setTimeout(() => {
              handleGetNumber();
            }, 1000);
          } catch (receiptError: any) {
            // Receipt polling failed, but transaction likely succeeded
            console.warn('⚠️ Could not get receipt, but transaction was submitted:', receiptError?.message);
            // Don't show error to user since transaction was already submitted successfully
          }
        })();
        
    } catch (e: any) {
        console.error('❌ Transaction submission failed:', e);
        console.error('Error details:', {
            message: e?.message,
            code: e?.code,
            reason: e?.reason,
            cause: e?.cause,
        });
        
        // Only set error state if submission actually failed
        setIsSuccess(false);
        
        // Provide helpful error messages
        let errorMessage = e?.message || 'Transaction failed';
        
        if (e?.message?.includes('paymaster')) {
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
        } else if (e?.message?.includes('rejected') || e?.message?.includes('denied')) {
            errorMessage = '❌ Transaction was rejected by user.';
        }
        
        setError(new Error(errorMessage));
        setIsError(true);
        setIsPending(false);
    }
  };

  const handleTransferUSDC = async () => {
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
    setTxHash(null);

    try {
        console.log('🚀 Attempting to transfer 0.0001 USDC via Smart Wallet:', {
            smartAccountAddress,
            usdcAddress,
            functionName: 'transfer',
            recipient: '0x0000000000000000000000000000000000000001', // Burn address
            amount: '100', // 0.0001 USDC (6 decimals)
        });
        
        // This will likely fail due to insufficient balance
        const userOpHash = await smartAccountClient.writeContract({
            address: usdcAddress as `0x${string}`,
            abi: usdcABI,
            functionName: 'transfer',
            args: [
              '0x0000000000000000000000000000000000000001' as `0x${string}`, // Recipient (burn address)
              BigInt(100), // 0.0001 USDC (6 decimals)
            ],
        });
        
        console.log('✅ USDC transfer submitted successfully!');
        console.log('📝 User Operation Hash:', userOpHash);
        
        setIsSuccess(true);
        setIsPending(false);
        setTxHash(userOpHash);
        
        // Background polling for receipt
        (async () => {
          try {
            const receipt = await smartAccountClient.waitForUserOperationReceipt({
                hash: userOpHash,
                timeout: 60_000,
                pollingInterval: 3_000,
            });
            
            console.log('✅ USDC transfer receipt:', receipt);
            
            const actualTxHash = receipt.receipt.transactionHash;
            if (actualTxHash) {
              setTxHash(actualTxHash);
            }
          } catch (receiptError: any) {
            console.warn('⚠️ Could not get receipt:', receiptError?.message);
          }
        })();
        
    } catch (e: any) {
        console.error('❌ USDC transfer failed:', e);
        console.error('Error details:', {
            message: e?.message,
            code: e?.code,
            reason: e?.reason,
            cause: e?.cause,
            shortMessage: e?.shortMessage,
            details: e?.details,
        });
        
        setIsSuccess(false);
        
        // Try to decode the hex error message if present
        let decodedError = '';
        const hexMatch = e?.message?.match(/0x08c379a0[0-9a-f]+/i);
        if (hexMatch) {
            try {
                const hex = hexMatch[0];
                // Remove the function selector (0x08c379a0) and extract the error message
                const errorHex = hex.slice(10); // Skip "0x08c379a0"
                const bytes: number[] = [];
                for (let i = 0; i < errorHex.length; i += 2) {
                    bytes.push(parseInt(errorHex.substr(i, 2), 16));
                }
                // Skip the first 64 characters (offset and length), then decode
                const messageStart = 68; // Characters, not bytes
                const messageBytes: number[] = [];
                for (let i = messageStart; i < errorHex.length; i += 2) {
                    const byte = parseInt(errorHex.substr(i, 2), 16);
                    if (byte !== 0) messageBytes.push(byte);
                }
                decodedError = String.fromCharCode(...messageBytes);
                console.log('🔍 Decoded error:', decodedError);
            } catch (decodeErr) {
                console.warn('Could not decode error hex:', decodeErr);
            }
        }
        
        // Provide helpful error messages
        let errorMessage = '';
        
        // Check for decoded error first
        if (decodedError.includes('exceeds balance') || decodedError.includes('insufficient')) {
            errorMessage = '❌ Insufficient USDC Balance\n\n';
            errorMessage += `Error: ${decodedError}\n\n`;
            errorMessage += `Your smart wallet doesn't have enough USDC.\n`;
            errorMessage += `Smart Wallet Address: ${smartAccountAddress}`;
        } else if (e?.message?.includes('insufficient') || e?.message?.includes('balance')) {
            errorMessage = '❌ Insufficient USDC balance\n\n';
            errorMessage += `Your smart wallet (${smartAccountAddress}) doesn't have enough USDC to complete this transfer.\n\n`;
            errorMessage += 'This is expected if you haven\'t funded your smart wallet with USDC yet.';
        } else if (e?.message?.includes('revert') || e?.shortMessage?.includes('revert')) {
            errorMessage = '❌ Transaction Reverted\n\n';
            if (decodedError) {
                errorMessage += `Contract Error: ${decodedError}\n\n`;
            } else {
                errorMessage += 'The USDC contract rejected this transaction.\n';
                errorMessage += 'Possible reasons:\n';
                errorMessage += '- Insufficient USDC balance\n';
                errorMessage += '- Contract execution error\n\n';
            }
            errorMessage += `Smart Wallet: ${smartAccountAddress}`;
        } else if (e?.message?.includes('paymaster')) {
            errorMessage = '⚠️ Paymaster Error\n\n';
            errorMessage += 'The paymaster rejected sponsoring this transaction.\n';
            errorMessage += 'Check your Pimlico dashboard: https://dashboard.pimlico.io/billing';
        } else if (e?.message?.includes('simulation') || e?.message?.includes('estimate')) {
            errorMessage = '❌ Transaction Simulation Failed\n\n';
            if (decodedError) {
                errorMessage += `Contract Error: ${decodedError}\n\n`;
            }
            errorMessage += 'This transaction would fail on-chain.\n';
            errorMessage += 'Most likely cause: Insufficient USDC balance in your smart wallet.\n\n';
            errorMessage += `Smart Wallet: ${smartAccountAddress}`;
        } else {
            errorMessage = '❌ Transaction Failed\n\n';
            if (decodedError) {
                errorMessage += `Error: ${decodedError}\n\n`;
            } else {
                errorMessage += e?.shortMessage || e?.message || 'An unknown error occurred.';
            }
        }
        
        setError(new Error(errorMessage));
        setIsError(true);
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
      
      // Use Alchemy RPC to avoid rate limits
      const alchemyRpcUrl = currentChain.id === 8453 
        ? 'https://base-mainnet.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9'
        : 'https://base-sepolia.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9';
      
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(alchemyRpcUrl),
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

      {/* USDC Transfer Test Button */}
      <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
        <p className="text-xs text-orange-700 font-semibold mb-2">
          🧪 Test Error Handling
        </p>
        <p className="text-xs text-orange-600 mb-3">
          Click below to test a USDC transfer. This will likely fail due to insufficient balance, allowing you to see the error message.
        </p>
        <button
          onClick={handleTransferUSDC}
          disabled={isPending || !isSmartWalletReady || isSmartWalletLoading}
          className="w-full px-4 py-2 font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
        >
          {isSmartWalletLoading 
            ? 'Setting up Smart Wallet...' 
            : isPending 
            ? 'Attempting USDC Transfer...' 
            : '💸 Transfer 0.0001 USDC'}
        </button>
      </div>

      {isSuccess && (
        <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="font-semibold text-green-700">
            ✅ Transaction successful!
          </p>
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
