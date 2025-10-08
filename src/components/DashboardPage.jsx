import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Button from '@mui/material/Button';

const DashboardPage = () => {
  const { logout, user } = usePrivy();

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
    </div>
  );
};

export default DashboardPage;
