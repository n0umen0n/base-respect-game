import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import App from './App';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'vladrespect',
    }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <WagmiProvider config={wagmiConfig}>
    <OnchainKitProvider
      apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
      chain={base}
      paymaster="v1_monthly_allowance"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </OnchainKitProvider>
  </WagmiProvider>
);
