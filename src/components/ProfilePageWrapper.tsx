import React from 'react';
import { useParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Box, Alert } from '@mui/material';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';
import ProfilePage from './ProfilePage';
import { LoadingScreen } from './LoadingSpinner';

export default function ProfilePageWrapper() {
  const { address } = useParams<{ address: string }>();
  const { user } = usePrivy();
  const { smartAccountClient, smartAccountAddress, isLoading: walletLoading } = useSmartWallet();
  
  // Always call hook, but it will handle null smartAccountClient gracefully
  const {
    respectBalance,
    loading: gameLoading,
  } = useRespectGame({
    smartAccountClient: user ? smartAccountClient : null,
    userAddress: address || null,
  });

  if ((user && walletLoading) || (user && gameLoading)) {
    return <LoadingScreen message="LOADING PROFILE..." />;
  }

  if (!address) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Invalid profile address</Alert>
      </Box>
    );
  }

  return (
    <ProfilePage
      walletAddress={address}
      respectBalance={respectBalance}
      currentUserAddress={smartAccountAddress || undefined}
    />
  );
}

