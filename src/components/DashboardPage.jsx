import React, { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import ContractInteractor from './ContractInteractor.tsx';
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
      {embeddedWallet ? (
        <ContractInteractor wallet={embeddedWallet} />
      ) : (
        <p>Please log in with an embedded wallet to use this feature.</p>
      )}
    </div>
  );
};
