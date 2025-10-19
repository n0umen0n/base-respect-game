import { useEffect } from 'react';
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
    createBanProposal,
    createTransferProposal,
  } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
  });

  // Log proposal creation capabilities
  useEffect(() => {
    if (user && smartAccountAddress) {
      console.log('=== PROPOSAL WRAPPER STATUS ===');
      console.log('Logged in as:', smartAccountAddress);
      console.log('Is Top Member:', isTopMember);
      console.log('Can create proposals:', isTopMember);
      console.log('===============================');
    }
  }, [user, smartAccountAddress, isTopMember]);

  // Allow viewing proposals without login
  if (!user) {
    return (
      <ProposalsPage
        userAddress=""
        isTopMember={false}
        onVote={async () => {
          alert('Please log in to vote on proposals');
        }}
        onCreateBanProposal={async () => {
          alert('Please log in to create proposals');
        }}
        onCreateTransferProposal={async () => {
          alert('Please log in to create proposals');
        }}
      />
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

  const handleCreateBanProposal = async (targetMember: string, description: string) => {
    await createBanProposal(targetMember, description);
  };

  const handleCreateTransferProposal = async (
    token: string,
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number,
    description: string
  ) => {
    const isETH = token === 'ETH';
    await createTransferProposal(tokenAddress, recipient, amount, decimals, description, isETH);
  };

  return (
    <ProposalsPage
      userAddress={smartAccountAddress}
      isTopMember={isTopMember}
      onVote={handleVoteOnProposal}
      onCreateBanProposal={handleCreateBanProposal}
      onCreateTransferProposal={handleCreateTransferProposal}
    />
  );
}

