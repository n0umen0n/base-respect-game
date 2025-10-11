import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import ContractInteractor from './ContractInteractor.tsx';
import Button from '@mui/material/Button';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleLogout = () => {
    disconnect();
    navigate('/');
  };

  return (
    <div style={{ paddingTop: '10rem', color: 'black' }}>
      <h1>Welcome!</h1>
      <p>You are logged in.</p>
      <div style={{ display: 'inline-block', marginTop: '2rem' }}>
        <Button
          variant="contained"
          onClick={handleLogout}
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
          {address
            ? `Logout ${address.slice(
                0,
                6
              )}...${address.slice(-4)}`
            : 'Logout'}
        </Button>
      </div>
      {isConnected ? (
        <ContractInteractor />
      ) : (
        <p>Please connect your wallet to use this feature.</p>
      )}
    </div>
  );
};
