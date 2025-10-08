import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

const ProtectedRoute = () => {
  const { user, ready } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
