import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAccount } from 'wagmi';

const ProtectedRoute = () => {
  const { isConnected, isConnecting } = useAccount();

  if (isConnecting) {
    return <div>Loading...</div>;
  }

  return isConnected ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
