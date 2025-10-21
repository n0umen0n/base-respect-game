import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import ProposalsPage from './ProposalsPage';
import { LoadingScreen } from './LoadingSpinner';

export default function ProposalsPageWrapper() {
  const { user } = usePrivy();
  const [pageLoading, setPageLoading] = useState(true);

  // Fast load for everyone - don't wait for wallet or blockchain
  return (
    <>
      {pageLoading && <LoadingScreen message="LOADING PROPOSALS..." />}
      <div style={{ display: pageLoading ? 'none' : 'block' }}>
        <ProposalsPage
          isLoggedIn={!!user}
          onLoadingChange={setPageLoading}
        />
      </div>
    </>
  );
}

