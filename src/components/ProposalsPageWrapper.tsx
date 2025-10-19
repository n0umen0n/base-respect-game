import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Box, Alert } from '@mui/material';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';
import ProposalsPage from './ProposalsPage';
import { LoadingScreen } from './LoadingSpinner';

export default function ProposalsPageWrapper() {
  const { user } = usePrivy();
  const { smartAccountClient, smartAccountAddress, isLoading: walletLoading } = useSmartWallet();
  
  const {
    isTopMember,
    loading: gameLoading,
    voteOnProposal,
  } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
  });

  if (!user) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="warning">Please log in to view proposals</Alert>
      </Box>
    );
  }

  if (walletLoading || gameLoading) {
    return <LoadingScreen message="LOADING PROPOSALS..." />;
  }

  if (!smartAccountAddress) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Unable to load wallet address</Alert>
      </Box>
    );
  }

  const handleVoteOnProposal = async (proposalId: number, voteFor: boolean) => {
    await voteOnProposal(proposalId, voteFor);
  };

  return (
    <ProposalsPage
      userAddress={smartAccountAddress}
      isTopMember={isTopMember}
      onVote={handleVoteOnProposal}
    />
  );
}

