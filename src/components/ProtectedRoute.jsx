import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { LoadingScreen } from './LoadingSpinner';

const ProtectedRoute = () => {
  const { user, ready } = usePrivy();

  if (!ready) {
    return <LoadingScreen message="AUTHENTICATING..." />;
  }

  return user ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
