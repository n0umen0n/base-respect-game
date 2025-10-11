import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { isAddress } from 'viem';

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

export default function ContractInteractor() {
  const [number, setNumber] = useState('');
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  const handleSendTransaction = async () => {
    if (!isAddress(contractAddress)) {
      alert(
        "Please replace 'YOUR_CONTRACT_ADDRESS' with your contract's deployed address."
      );
      return;
    }

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'setNumber',
      args: [BigInt(number)],
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-gray-800 mt-8">
      <h2 className="text-xl font-bold mb-2">Interact with Smart Contract (Gasless)</h2>
      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="Enter a number"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
      />
      <button
        onClick={handleSendTransaction}
        disabled={!number || isPending || !address}
        className="w-full px-4 py-2 mt-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isPending ? 'Sending...' : 'Set Number (Sponsored)'}
      </button>
      {isSuccess && (
        <p className="mt-2 text-sm text-green-600">
          Transaction successful!
        </p>
      )}
      {isError && (
        <p className="mt-2 text-sm text-red-600">
          Transaction failed: {error?.message || 'An unknown error occurred.'}
        </p>
      )}
    </div>
  );
}
