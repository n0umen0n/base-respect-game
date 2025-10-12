import React, { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import ContractInteractor from './ContractInteractor.tsx';
import SupabaseTest from './SupabaseTest.tsx';
import UserStatsCard from './UserStatsCard.tsx';
import SimpleLeaderboard from './SimpleLeaderboard.tsx';
import Button from '@mui/material/Button';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

  return (
    <div style={{ paddingTop: '10rem', color: 'black' }}>
      <h1>Welcome!</h1>
      <p>You are logged in.</p>
      <div style={{ display: 'inline-block', marginTop: '2rem' }}>
        <Button
          variant="contained"
          onClick={logout}
          sx={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '1rem',
            textTransform: 'uppercase',
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '9999px',
            padding: '1rem 2rem',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          {user
            ? `Logout ${user.wallet?.address.slice(
                0,
                6
              )}...${user.wallet?.address.slice(-4)}`
            : 'Logout'}
        </Button>
      </div>

      {embeddedWallet && (
        <>
          {/* Real-time Stats Section */}
          <div style={{ marginTop: '3rem', maxWidth: '1200px', margin: '3rem auto 0' }}>
            <h2 style={{ 
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ⚡ REAL-TIME DASHBOARD
            </h2>
            
            {/* User Stats */}
            <div style={{ marginBottom: '2rem' }}>
              <UserStatsCard walletAddress={embeddedWallet.address} />
            </div>

            {/* Contract Interactor */}
            <div style={{ marginBottom: '2rem' }}>
              <ContractInteractor wallet={embeddedWallet} />
            </div>

            {/* Leaderboard */}
            <div>
              <SimpleLeaderboard />
            </div>
          </div>
        </>
      )}

      {!embeddedWallet && (
        <p>Please log in with an embedded wallet to use this feature.</p>
      )}
    </div>
  );
};
