import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import ProfilePage from './ProfilePage';
import { LoadingScreen } from './LoadingSpinner';

export default function ProfilePageWrapper() {
  const { address } = useParams<{ address: string }>();
  const [pageLoading, setPageLoading] = useState(true);

  if (!address) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Invalid profile address</Alert>
      </Box>
    );
  }

  // Profile page is completely independent - no wallet, no blockchain
  // Just pure Supabase data loading
  return (
    <>
      {pageLoading && <LoadingScreen message="LOADING PROFILE..." />}
      <div style={{ display: pageLoading ? 'none' : 'block' }}>
        <ProfilePage
          walletAddress={address}
          currentUserAddress={undefined}
          onLoadingChange={setPageLoading}
        />
      </div>
    </>
  );
}

