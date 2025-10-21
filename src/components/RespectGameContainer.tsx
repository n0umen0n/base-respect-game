import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Box } from '@mui/material';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { getMember, getCurrentGameStage, getMemberContribution, getMemberGroup, getMemberRanking } from '../lib/supabase-respect';
import ProfileCreation from './ProfileCreation';
import ContributionSubmission from './ContributionSubmission';
import RankingSubmission from './RankingSubmission';
import ProfilePage from './ProfilePage';
import ProposalsPage from './ProposalsPage';
import { LoadingScreen } from './LoadingSpinner';

type View = 'profile-creation' | 'contribution' | 'ranking' | 'profile' | 'proposals';

export default function RespectGameContainer() {
  const { user, authenticated } = usePrivy();
  const { smartAccountClient, smartAccountAddress, isLoading: walletLoading } = useSmartWallet();

  // Try to restore last view from sessionStorage for instant refresh
  const getCachedView = (): View | null => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('lastGameView');
      return cached as View | null;
    }
    return null;
  };

  // NO MORE useRespectGame - all data from Supabase only
  const [memberData, setMemberData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View | null>(getCachedView()); // Start with cached view
  
  // Helper to set view and cache it
  const updateView = (view: View) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastGameView', view);
    }
  };
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Always show loading initially
  const [childLoading, setChildLoading] = useState(true); // Track child component loading
  const [loadingMessage, setLoadingMessage] = useState<string>('LOADING GAME...');
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState<number>(Date.now());
  const [supabaseGameData, setSupabaseGameData] = useState<{
    gameNumber: number;
    stage: string;
    nextStageTimestamp: Date;
  } | null>(null);

  useEffect(() => {
    console.log('🔄 RespectGameContainer effect:', { 
      walletLoading, 
      authenticated, 
      smartAccountAddress 
    });

    if (!walletLoading && authenticated && smartAccountAddress) {
      console.log('▶️ Starting determineView...');
      setLoading(true);
      setChildLoading(true); // Reset child loading when determining view
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout - forcing profile view');
        setLoading(false);
        setChildLoading(false);
        updateView('profile');
      }, 10000); // 10 second timeout

      determineView()
        .then(() => {
          console.log('✅ determineView completed successfully');
        })
        .catch((err) => {
          console.error('❌ determineView failed:', err);
        })
        .finally(() => {
          clearTimeout(timeout);
        });

      return () => clearTimeout(timeout);
    } else if (!authenticated) {
      // If not authenticated, stop loading and don't show anything
      console.log('👤 Not authenticated - clearing view');
      setLoading(false);
      setChildLoading(false);
      setCurrentView(null);
    } else {
      console.log('⏳ Waiting for wallet or auth...');
    }
  }, [walletLoading, authenticated, smartAccountAddress]);

  const determineView = async () => {
    try {
      if (!smartAccountAddress) {
        setLoading(false);
        return;
      }

      console.log('🎮 Determining game view for:', smartAccountAddress);

      // Check if user has a profile in Supabase (NOT blockchain)
      const memberData = await getMember(smartAccountAddress);
      
      if (!memberData) {
        // No profile in Supabase, show profile creation
        updateView('profile-creation');
        setLoading(false);
        return;
      }

      // Check if member is banned
      if (memberData.is_banned) {
        updateView('profile');
        setLoading(false);
        return;
      }

      // If not approved, show profile
      if (!memberData.is_approved) {
        updateView('profile');
        setLoading(false);
        return;
      }

      // Get current game stage from Supabase
      const gameStageData = await getCurrentGameStage();
      
      if (!gameStageData) {
        // No game stage data, show profile
        updateView('profile');
        setLoading(false);
        return;
      }

      const { current_game_number, current_stage, next_stage_timestamp } = gameStageData;
      
      // Store game data for component props
      setSupabaseGameData({
        gameNumber: current_game_number,
        stage: current_stage,
        nextStageTimestamp: new Date(next_stage_timestamp),
      });

      if (current_stage === 'ContributionSubmission') {
        // Contribution Submission Stage
        // Check if user already submitted in Supabase
        const contribution = await getMemberContribution(
          smartAccountAddress,
          current_game_number
        );

        if (contribution) {
          // Already submitted, show profile
          updateView('profile');
        } else {
          // Has not submitted, show contribution form
          updateView('contribution');
        }
      } else {
        // Ranking Stage ('ContributionRanking')
        // First check if user has already submitted their ranking
        const userRanking = await getMemberRanking(
          smartAccountAddress,
          current_game_number
        );

        if (userRanking) {
          // Already submitted ranking, show profile
          updateView('profile');
        } else {
          // Has not submitted ranking, check if user has a group assigned
          const groupData = await getMemberGroup(
            smartAccountAddress,
            current_game_number
          );

          if (groupData && groupData.members.length > 0) {
            // Has a group, fetch member details and contributions for all group members
            const membersWithData = await Promise.all(
              groupData.members.map(async (memberAddress: string) => {
                const memberInfo = await getMember(memberAddress);
                const contributionData = await getMemberContribution(
                  memberAddress,
                  current_game_number
                );

                return {
                  address: memberAddress,
                  name: memberInfo?.name || 'Unknown',
                  profileUrl: memberInfo?.profile_url,
                  xAccount: memberInfo?.x_account,
                  xVerified: memberInfo?.x_verified || false,
                  contributions: contributionData?.contributions || [],
                  links: contributionData?.links || [],
                };
              })
            );

            setGroupMembers(membersWithData);
            updateView('ranking');
          } else {
            // No group assigned yet, show profile
            updateView('profile');
          }
        }
      }

      console.log('✅ View determined, setting view to:', currentView);
      setLoading(false);
      setChildLoading(false); // Reset child loading state
    } catch (error) {
      console.error('❌ Error determining view:', error);
      // On error, default to profile view
      updateView('profile');
      setLoading(false);
      setChildLoading(false); // Reset child loading state
    }
  };

  const handleProfileCreated = async () => {
    // Wait a bit for webhook to process and update Supabase
    // Then check Supabase and determine appropriate view
    await new Promise(resolve => setTimeout(resolve, 2000));
    await determineView();
  };

  const handleContributionSubmitted = async () => {
    setLoading(true);
    setLoadingMessage('PROCESSING SUBMISSION...');
    
    if (!smartAccountAddress || !supabaseGameData) {
      setLoading(false);
      updateView('profile');
      return;
    }
    
    // Poll until contribution appears in Supabase (max 10 seconds)
    const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    let attempts = 0;
    let contributionFound = false;
    
    while (attempts < maxAttempts && !contributionFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const contribution = await getMemberContribution(
        smartAccountAddress,
        supabaseGameData.gameNumber
      );
      
      if (contribution) {
        contributionFound = true;
        console.log('✅ Contribution found in Supabase after', (attempts + 1) * 500, 'ms');
      } else {
        attempts++;
      }
    }
    
    if (!contributionFound) {
      console.warn('⚠️ Contribution not found in Supabase after 10 seconds, navigating anyway');
    }
    
    // Trigger profile refresh to show new contribution
    setProfileRefreshTrigger(Date.now());
    
    setLoading(false);
    
    // Always navigate to profile after submission
    updateView('profile');
  };

  const handleRankingSubmitted = async () => {
    setLoading(true);
    setLoadingMessage('PROCESSING SUBMISSION...');
    
    if (!smartAccountAddress || !supabaseGameData) {
      setLoading(false);
      updateView('profile');
      return;
    }
    
    // Poll until ranking appears in Supabase (max 10 seconds)
    const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    let attempts = 0;
    let rankingFound = false;
    
    while (attempts < maxAttempts && !rankingFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const ranking = await getMemberRanking(
        smartAccountAddress,
        supabaseGameData.gameNumber
      );
      
      if (ranking) {
        rankingFound = true;
        console.log('✅ Ranking found in Supabase after', (attempts + 1) * 500, 'ms');
      } else {
        attempts++;
      }
    }
    
    if (!rankingFound) {
      console.warn('⚠️ Ranking not found in Supabase after 10 seconds, navigating anyway');
    }
    
    // Trigger profile refresh
    setProfileRefreshTrigger(Date.now());
    
    setLoading(false);
    
    // Always navigate to profile after submission
    updateView('profile');
  };

  // Note: All blockchain interactions (becomeMember, submitContribution, submitRanking)
  // are now handled directly by the child components using useRespectGame hook

  const handleVoteOnProposal = async (proposalId: number, voteFor: boolean) => {
    throw new Error('voteOnProposal should be handled by ProposalsPage component');
  };

  // Show loading screen while wallet is loading OR while determining view
  if (walletLoading || loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Don't render anything if we don't have a view yet
  if (!currentView) {
    return <LoadingScreen message="LOADING..." />;
  }

  // Use overlay pattern for child loading
  const showChildLoading = childLoading;

  return (
    <>
      {showChildLoading && <LoadingScreen message={loadingMessage} />}
      <div style={{ display: showChildLoading ? 'none' : 'block' }}>
        {currentView === 'profile-creation' && smartAccountAddress && (
          <ProfileCreation
            walletAddress={smartAccountAddress}
            onSuccess={handleProfileCreated}
            onLoadingChange={setChildLoading}
          />
        )}

        {currentView === 'contribution' && supabaseGameData && (
          <ContributionSubmission
            gameNumber={supabaseGameData.gameNumber}
            nextStageTimestamp={supabaseGameData.nextStageTimestamp}
            onNavigate={handleContributionSubmitted}
            onLoadingChange={setChildLoading}
          />
        )}

        {currentView === 'ranking' && supabaseGameData && (
          <RankingSubmission
            gameNumber={supabaseGameData.gameNumber}
            groupMembers={groupMembers}
            nextSubmissionStageDate={supabaseGameData.nextStageTimestamp}
            onNavigate={handleRankingSubmitted}
            onLoadingChange={setChildLoading}
          />
        )}

        {currentView === 'profile' && smartAccountAddress && (
          <ProfilePage
            walletAddress={smartAccountAddress}
            refreshTrigger={profileRefreshTrigger}
            currentUserAddress={smartAccountAddress}
            onLoadingChange={setChildLoading}
          />
        )}

        {currentView === 'proposals' && smartAccountAddress && (
          <ProposalsPage
            isLoggedIn={authenticated && !!smartAccountAddress}
            onLoadingChange={setChildLoading}
          />
        )}
      </div>
    </>
  );
}

