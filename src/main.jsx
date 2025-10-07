import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'viem/chains';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmggwuowc004rjv0cwhieow2l"
      config={{
        defaultChain: base,
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        loginMethods: [
          'email',
          'sms',
          'google',
          'apple',
          'twitter',
          'discord',
          'wallet'
        ],
        appearance: {
          walletList: ['metamask', 'coinbase_wallet', 'walletconnect']
        },
        externalWallets: {
          walletConnect: {
            // Your WalletConnect project ID
            projectId: 'replace-with-your-walletconnect-project-id'
          }
        }
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
