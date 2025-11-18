import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import RespectGameContainer from './components/RespectGameContainer';
import ProfilePageWrapper from './components/ProfilePageWrapper';
import ProposalsPageWrapper from './components/ProposalsPageWrapper';
import ProtectedRoute from './components/ProtectedRoute';
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
      },
      embeddedWallets: {
        createOnLogin: 'users-without-wallets',
        requireUserPasswordOnCreate: false,
      },
      mfa: {
        requireForAppWallets: true,
      },
    }}
  >
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="profile/:address" element={<ProfilePageWrapper />} />
          <Route path="proposals" element={<ProposalsPageWrapper />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="game" element={<RespectGameContainer />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </PrivyProvider>
);
