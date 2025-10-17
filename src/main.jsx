import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import RespectGameContainer from './components/RespectGameContainer';
import ProtectedRoute from './components/ProtectedRoute';
import XAuthCallback from './components/XAuthCallback';
import './index.css';
import { base } from 'viem/chains';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <PrivyProvider
    appId="cmggwuowc004rjv0cwhieow2l"
    config={{
      defaultChain: base,
      loginMethods: [
        'email',
        'sms',
        'google',
        'apple',
        'twitter',
        'discord',
      ],
      appearance: {
        theme: 'light',
        accentColor: '#676FFF',
        walletList: ['metamask', 'coinbase_wallet', 'walletconnect']
      },
      embeddedWallets: {
        createOnLogin: 'users-without-wallets',
        requireUserPasswordOnCreate: true,
      },
      mfa: {
        requireForAppWallets: true,
      },
      externalWallets: {
        walletConnect: {
          // Your WalletConnect project ID
          projectId: 'replace-with-your-walletconnect-project-id',
        },
      },
    }}
  >
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="game" element={<RespectGameContainer />} />
          </Route>
        </Route>
        {/* X OAuth Callback Route - outside of App layout */}
        <Route path="/auth/x/callback" element={<XAuthCallback />} />
      </Routes>
    </BrowserRouter>
  </PrivyProvider>
);
