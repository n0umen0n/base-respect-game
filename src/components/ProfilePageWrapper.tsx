import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import ProfilePage from './ProfilePage';
import { LoadingScreen } from './LoadingSpinner';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { usePrivy } from '@privy-io/react-auth';

export default function ProfilePageWrapper() {
  const { address } = useParams<{ address: string }>();
  const [pageLoading, setPageLoading] = useState(true);
  const { authenticated } = usePrivy();
  
  // Get current user's smart account address to check if viewing own profile
  const { smartAccountAddress } = useSmartWallet();

  if (!address) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Invalid profile address</Alert>
      </Box>
    );
  }

  // Pass current user's address so ProfilePage can detect if it's their own profile
  // This enables the CONNECT X button on own profile
  return (
    <>
      {pageLoading && <LoadingScreen message="LOADING PROFILE..." />}
      <div style={{ display: pageLoading ? 'none' : 'block' }}>
        <ProfilePage
          walletAddress={address}
          currentUserAddress={authenticated ? smartAccountAddress : undefined}
          onLoadingChange={setPageLoading}
        />
      </div>
    </>
  );
}

