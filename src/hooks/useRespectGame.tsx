import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '../config/contracts.config';

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

const RESPECT_GAME_GOVERNANCE_ABI = [
  {
    name: 'voteOnProposal',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voteFor', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'createBanProposal',
    type: 'function',
    inputs: [
      { name: 'targetMember', type: 'address' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'createApproveMemberProposal',
    type: 'function',
    inputs: [
      { name: 'targetMember', type: 'address' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

// Contract addresses (imported from centralized config)
const RESPECT_GAME_CORE_ADDRESS = CONTRACTS.RESPECT_GAME_CORE;
const RESPECT_TOKEN_ADDRESS = CONTRACTS.RESPECT_TOKEN;
const RESPECT_GAME_GOVERNANCE_ADDRESS = CONTRACTS.RESPECT_GAME_GOVERNANCE;

interface UseRespectGameProps {
  smartAccountClient: any;
  userAddress: string | null;
}

export function useRespectGame({ smartAccountClient, userAddress }: UseRespectGameProps) {
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

  // Load game state and member info
  useEffect(() => {
    if (smartAccountClient && userAddress) {
      loadGameData();
    }
  }, [smartAccountClient, userAddress]);

  const loadGameData = async () => {
    if (!smartAccountClient || !userAddress) return;

    try {
      setLoading(true);

      // Read contract data
      const [gameNumber, stage, nextTimestamp, member, topMember, balance] = await Promise.all([
        smartAccountClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'currentGameNumber',
        }),
        smartAccountClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getCurrentStage',
        }),
        smartAccountClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getNextStageTimestamp',
        }),
        smartAccountClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'getMember',
          args: [userAddress],
        }),
        smartAccountClient.readContract({
          address: RESPECT_GAME_CORE_ADDRESS,
          abi: RESPECT_GAME_CORE_ABI,
          functionName: 'isTopMember',
          args: [userAddress],
        }),
        smartAccountClient.readContract({
          address: RESPECT_TOKEN_ADDRESS,
          abi: RESPECT_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [userAddress],
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
    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getMyGroup = async (gameNumber: number) => {
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const result = await smartAccountClient.readContract({
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
    if (!smartAccountClient) throw new Error('Wallet not connected');

    const result = await smartAccountClient.readContract({
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
    getMyGroup,
    getContribution,
    refreshData: loadGameData,
  };
}

