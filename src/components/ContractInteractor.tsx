import React, { useState, useEffect } from 'react';
import { useSendTransaction } from '@privy-io/react-auth';
import { isAddress, Abi, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

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
] as const;

// The address of your deployed SimpleStorage contract
const contractAddress = '0x44aC2daE725b989Df123243A21C9b52b224B4273';

interface ContractInteractorProps {
    wallet: any;
}

export default function ContractInteractor({ wallet }: ContractInteractorProps) {
  const [number, setNumber] = useState('');
  const { sendTransaction } = useSendTransaction();
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
    
    // Check wallet connection and chain
    const chainIdNum = parseChainId(wallet?.chainId);
    
    console.log('📱 Wallet Info:', {
        address: wallet?.address,
        walletType: wallet?.walletClientType,
        chainId: wallet?.chainId,
        chainIdNum,
        expectedChainId: 8453, // Base mainnet
    });
    
    // If not on Base, try to switch
    if (chainIdNum !== 8453) {
      console.log('⚠️ Not on Base network. Attempting to switch...');
      const switched = await switchToBase();
      if (!switched) {
        return; // Exit if switch failed
      }
      // Wait a moment for the network switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const txData = encodeFunctionData({
        abi: contractABI,
        functionName: 'setNumber',
        args: [BigInt(number)],
    });

    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);

    try {
        console.log('🚀 Attempting sponsored transaction with config:', {
            to: contractAddress,
            data: txData,
            sponsor: true,
            walletAddress: wallet?.address,
            walletType: wallet?.walletClientType,
            chainId: wallet?.chainId,
        });
        
        const receipt = await sendTransaction({
            to: contractAddress,
            data: txData,
        },
        {
            sponsor: true,
        } as any);
        
        console.log('✅ Transaction successful! Receipt:', receipt);
        // Extract transaction hash from receipt if available
        const hash = typeof receipt === 'string' ? receipt : (receipt as any)?.transactionHash || (receipt as any)?.hash;
        if (hash) setTxHash(hash);
        setIsSuccess(true);
    } catch (e: any) {
        console.error('❌ Transaction failed:', e);
        console.error('Error details:', {
            message: e?.message,
            code: e?.code,
            reason: e?.reason,
        });
        
        // Check if it's a sponsorship issue
        if (e?.message?.includes('insufficient funds')) {
            const sponsorshipError = new Error(
                '⚠️ Gas sponsorship is not working. Please check Privy Dashboard:\n' +
                '1. Enable "Allow transactions from the client"\n' +
                '2. Ensure Base chain (8453) is enabled\n' +
                '3. Verify sponsorship wallet has funds\n' +
                '4. Check spending limits'
            );
            setError(sponsorshipError);
        } else {
            setError(e as Error);
        }
        setIsError(true);
    } finally {
        setIsPending(false);
    }
  };

  const isOnBaseNetwork = () => {
    const chainIdNum = parseChainId(currentChainId);
    return chainIdNum === 8453;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-gray-800 mt-8">
      <h2 className="text-xl font-bold mb-2">Interact with Smart Contract (Gasless)</h2>
      
      {/* Network Status Indicator */}
      <div className={`mb-3 p-2 rounded-lg text-sm ${isOnBaseNetwork() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {isOnBaseNetwork() ? (
          <span>✅ Connected to Base Network</span>
        ) : (
          <div>
            <span>⚠️ Not on Base Network</span>
            <button
              onClick={switchToBase}
              disabled={isSwitchingNetwork}
              className="ml-2 px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
            >
              {isSwitchingNetwork ? 'Switching...' : 'Switch to Base'}
            </button>
          </div>
        )}
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
        disabled={!number || isPending || !wallet.address || isSwitchingNetwork}
        className="w-full px-4 py-2 mt-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSwitchingNetwork ? 'Switching Network...' : isPending ? 'Sending...' : 'Set Number (Sponsored)'}
      </button>
      {isSuccess && (
        <div className="mt-2 text-sm text-green-600">
          <p className="font-semibold">✅ Transaction successful!</p>
          {txHash && (
            <a 
              href={`https://basescan.org/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-green-700"
            >
              View on BaseScan
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
