import { useState, useEffect, useCallback } from 'react';
import { parseEther, formatEther, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { CONTRACTS } from '../config/contracts.config';
import RespectGameGovernanceArtifact from '../contracts/RespectGameGovernance.json';

// Contract ABIs (simplified - add full ABIs in production)
const RESPECT_GAME_CORE_ABI = [
  {
    name: 'becomeMember',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'profileUrl', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'xAccount', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'submitContribution',
    type: 'function',
    inputs: [
      { name: 'contributions', type: 'string[]' },
      { name: 'links', type: 'string[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'submitRanking',
    type: 'function',
    inputs: [{ name: 'rankedAddresses', type: 'address[]' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getMember',
    type: 'function',
    inputs: [{ name: 'memberAddress', type: 'address' }],
    outputs: [
      { name: 'wallet', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'profileUrl', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'xAccount', type: 'string' },
      { name: 'isApproved', type: 'bool' },
      { name: 'isBanned', type: 'bool' },
      { name: 'totalRespectEarned', type: 'uint256' },
      { name: 'averageRespect', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getCurrentStage',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'getNextStageTimestamp',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'currentGameNumber',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getMyGroup',
    type: 'function',
    inputs: [{ name: 'gameNumber', type: 'uint256' }],
    outputs: [
      { name: '', type: 'address[]' },
      { name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getContribution',
    type: 'function',
    inputs: [
      { name: 'gameNumber', type: 'uint256' },
      { name: 'contributor', type: 'address' },
    ],
    outputs: [
      { name: 'contributions', type: 'string[]' },
      { name: 'links', type: 'string[]' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'isTopMember',
    type: 'function',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'getTopMembers',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address[6]' }],
    stateMutability: 'view',
  },
  {
    name: 'approveMemberByGovernance',
    type: 'function',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const RESPECT_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// Import the full ABI from the compiled contract artifact
const RESPECT_GAME_GOVERNANCE_ABI = RespectGameGovernanceArtifact.abi;

// Contract addresses (imported from centralized config)
const RESPECT_GAME_CORE_ADDRESS = CONTRACTS.RESPECT_GAME_CORE;
const RESPECT_TOKEN_ADDRESS = CONTRACTS.RESPECT_TOKEN;
const RESPECT_GAME_GOVERNANCE_ADDRESS = CONTRACTS.RESPECT_GAME_GOVERNANCE;

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/ge46HCVEaL0VN6UKS5Yw9'),
});

interface UseRespectGameProps {
  smartAccountClient: any;
  userAddress: string | null;
  minimalMode?: boolean; // Only fetch isTopMember, skip expensive calls
}

export function useRespectGame({ smartAccountClient, userAddress, minimalMode = false }: UseRespectGameProps) {
  const [gameState, setGameState] = useState<{
    currentGameNumber: number;
    currentStage: 0 | 1; // 0 = Submission, 1 = Ranking
    nextStageTimestamp: number;
  } | null>(null);

  const [memberInfo, setMemberInfo] = useState<{
    exists: boolean;
    isApproved: boolean;
    isBanned: boolean;
    totalRespectEarned: number;
    averageRespect: number;
  } | null>(null);

  const [isTopMember, setIsTopMember] = useState(false);
  const [respectBalance, setRespectBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadGameData = useCallback(async () => {
    if (!userAddress) return;

    try {
      setLoading(true);

      // Minimal mode: only fetch isTopMember (for proposals page)
      if (minimalMode) {
        const topMember = await publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'isTopMember',
          args: [userAddress as `0x${string}`],
        });
        
        setIsTopMember(topMember);
        setLoading(false);
        return;
      }

      // Full mode: fetch all data (for game container)
      // Read contract data using public client
      const [gameNumber, stage, nextTimestamp, member, topMember, balance, topMembers] = await Promise.all([
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'currentGameNumber',
        }),
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getCurrentStage',
        }),
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getNextStageTimestamp',
        }),
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getMember',
          args: [userAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'isTopMember',
          args: [userAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: RESPECT_TOKEN_ADDRESS,
          abi: RESPECT_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getTopMembers',
        }),
      ]);

      setGameState({
        currentGameNumber: Number(gameNumber),
        currentStage: stage as 0 | 1,
        nextStageTimestamp: Number(nextTimestamp),
      });

      const memberExists = member[0] !== '0x0000000000000000000000000000000000000000';
      setMemberInfo({
        exists: memberExists,
        isApproved: member[5],
        isBanned: member[6],
        totalRespectEarned: Number(member[7]),
        averageRespect: Number(member[8]),
      });

      setIsTopMember(topMember);
      setRespectBalance(Number(formatEther(balance)));

      // Console log top members info
      console.log('=== TOP MEMBERS INFO ===');
      console.log('Top 6 Members:', topMembers);
      console.log('Your address:', userAddress);
      console.log('Are you a top member?', topMember);
      console.log('========================');
    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setLoading(false);
    }
  }, [userAddress, minimalMode]);

  // Load game state and member info
  useEffect(() => {
    if (userAddress) {
      loadGameData();
    } else {
      setLoading(false);
    }
  }, [userAddress, loadGameData]);

  // Contract write functions
  const becomeMember = async (
    name: string,
    profileUrl: string,
    description: string,
    xAccount: string
  ) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'becomeMember',
      args: [name, profileUrl, description, xAccount],
    });

    console.log('Transaction hash:', hash);
    
    // Wait for transaction and reload data
    await new Promise(resolve => setTimeout(resolve, 3000));
    await loadGameData();
    
    return hash;
  };

  const submitContribution = async (contributions: string[], links: string[]) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'submitContribution',
      args: [contributions, links],
    });

    console.log('Transaction hash:', hash);
    return hash;
  };

  const submitRanking = async (rankedAddresses: string[]) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'submitRanking',
      args: [rankedAddresses],
    });

    console.log('Transaction hash:', hash);
    return hash;
  };

  const voteOnProposal = async (proposalId: number, voteFor: boolean) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_GOVERNANCE_ADDRESS,
      abi: RESPECT_GAME_GOVERNANCE_ABI,
      functionName: 'voteOnProposal',
      args: [BigInt(proposalId), voteFor],
    });

    console.log('Transaction hash:', hash);
    return hash;
  };

  const createBanProposal = async (targetMember: string, description: string) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    // Encode the call to removeMember(address)
    // Function signature: removeMember(address)
    const functionSelector = '0x0b1ca49a'; // removeMember(address)
    
    // Encode parameters: member address (32 bytes)
    const memberPadded = targetMember.slice(2).padStart(64, '0');
    const calldata = `${functionSelector}${memberPadded}` as `0x${string}`;

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_GOVERNANCE_ADDRESS,
      abi: RESPECT_GAME_GOVERNANCE_ABI,
      functionName: 'createProposal',
      args: [
        [RESPECT_GAME_CORE_ADDRESS as `0x${string}`],
        [0n],
        [calldata],
        description
      ],
    });

    console.log('Ban proposal created, transaction hash:', hash);
    return hash;
  };

  const createTransferProposal = async (
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number,
    description: string,
    isETH: boolean = false
  ) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    // Parse amount to wei/smallest unit
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

    let calldata: `0x${string}`;
    let value: bigint = 0n;
    let target: `0x${string}`;

    if (isETH) {
      // For ETH transfer, we send directly to recipient with value
      target = recipient as `0x${string}`;
      value = amountBigInt;
      calldata = '0x' as `0x${string}`; // Empty calldata
    } else {
      // For ERC20 transfer, encode the transfer function call
      // Function signature: transfer(address,uint256)
      const functionSelector = '0xa9059cbb'; // transfer(address,uint256)
      
      // Encode parameters: recipient address (32 bytes) + amount (32 bytes)
      const recipientPadded = recipient.slice(2).padStart(64, '0');
      const amountHex = amountBigInt.toString(16).padStart(64, '0');
      
      calldata = `${functionSelector}${recipientPadded}${amountHex}` as `0x${string}`;
      target = tokenAddress as `0x${string}`;
      value = 0n;
    }

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_GOVERNANCE_ADDRESS,
      abi: RESPECT_GAME_GOVERNANCE_ABI,
      functionName: 'createProposal',
      args: [[target], [value], [calldata], description],
    });

    console.log('Transfer proposal created, transaction hash:', hash);
    return hash;
  };

  const getMyGroup = async (gameNumber: number) => {
    const result = await publicClient.readContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'getMyGroup',
      args: [BigInt(gameNumber)],
    });

    return {
      members: result[0],
      groupId: Number(result[1]),
    };
  };

  const getContribution = async (gameNumber: number, contributor: string) => {
    const result = await publicClient.readContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'getContribution',
      args: [BigInt(gameNumber), contributor as `0x${string}`],
    });

    return {
      contributions: result[0],
      links: result[1],
    };
  };

  const approveMember = async (memberAddress: string) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const hash = await smartAccountClient.writeContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'approveMemberByGovernance',
      args: [memberAddress as `0x${string}`],
    });

    console.log('Ape approval transaction hash:', hash);
    return hash;
  };

  return {
    gameState,
    memberInfo,
    isTopMember,
    respectBalance,
    loading,
    becomeMember,
    submitContribution,
    submitRanking,
    voteOnProposal,
    approveMember,
    createBanProposal,
    createTransferProposal,
    getMyGroup,
    getContribution,
    refreshData: loadGameData,
  };
}

