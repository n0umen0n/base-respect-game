import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Box } from '@mui/material';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';
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
  const {
    gameState,
    memberInfo,
    isTopMember,
    respectBalance,
    loading: gameLoading,
    becomeMember,
    submitContribution,
    submitRanking,
    voteOnProposal,
    getMyGroup,
    getContribution,
    refreshData,
  } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
  });

  const [currentView, setCurrentView] = useState<View | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('LOADING GAME...');
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState<number>(Date.now());
  const [supabaseGameData, setSupabaseGameData] = useState<{
    gameNumber: number;
    stage: string;
    nextStageTimestamp: Date;
  } | null>(null);

  useEffect(() => {
    if (!walletLoading && !gameLoading && authenticated && smartAccountAddress) {
      determineView();
    }
  }, [walletLoading, gameLoading, authenticated, smartAccountAddress, memberInfo, gameState]);

  const determineView = async () => {
    try {
      setLoading(true);

      if (!smartAccountAddress) {
        setLoading(false);
        return;
      }

      // Check if user has a profile in Supabase (NOT blockchain)
      const memberData = await getMember(smartAccountAddress);
      
      if (!memberData) {
        // No profile in Supabase, show profile creation
        setCurrentView('profile-creation');
        setLoading(false);
        return;
      }

      // Check if member is banned
      if (memberData.is_banned) {
        setCurrentView('profile');
        setLoading(false);
        return;
      }

      // If not approved, show profile
      if (!memberData.is_approved) {
        setCurrentView('profile');
        setLoading(false);
        return;
      }

      // Get current game stage from Supabase
      const gameStageData = await getCurrentGameStage();
      
      if (!gameStageData) {
        // No game stage data, show profile
        setCurrentView('profile');
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
          setCurrentView('profile');
        } else {
          // Has not submitted, show contribution form
          setCurrentView('contribution');
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
          setCurrentView('profile');
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
            setCurrentView('ranking');
          } else {
            // No group assigned yet, show profile
            setCurrentView('profile');
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error determining view:', error);
      setCurrentView('profile');
      setLoading(false);
    }
  };

  const handleProfileCreated = async () => {
    await refreshData();
    
    // Wait a bit for webhook to process and update Supabase
    // Then check Supabase and determine appropriate view
    await new Promise(resolve => setTimeout(resolve, 2000));
    await determineView();
  };

  const handleContributionSubmitted = async () => {
    setLoading(true);
    setLoadingMessage('PROCESSING SUBMISSION...');
    
    await refreshData();
    
    if (!smartAccountAddress || !supabaseGameData) {
      setLoading(false);
      setCurrentView('profile');
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
    setCurrentView('profile');
  };

  const handleRankingSubmitted = async () => {
    setLoading(true);
    setLoadingMessage('PROCESSING SUBMISSION...');
    
    await refreshData();
    
    if (!smartAccountAddress || !supabaseGameData) {
      setLoading(false);
      setCurrentView('profile');
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
    setCurrentView('profile');
  };

  const handleBecomeMember = async (
    name: string,
    profileUrl: string,
    description: string,
    xAccount: string
  ) => {
    // Submit to blockchain - webhook will save all data from the event
    await becomeMember(name, profileUrl, description, xAccount);
  };

  const handleSubmitContribution = async (contributions: string[], links: string[]) => {
    await submitContribution(contributions, links);
  };

  const handleSubmitRanking = async (rankedAddresses: string[]) => {
    await submitRanking(rankedAddresses);
  };

  const handleVoteOnProposal = async (proposalId: number, voteFor: boolean) => {
    await voteOnProposal(proposalId, voteFor);
  };

  if (walletLoading || gameLoading || loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (!currentView) {
    return <LoadingScreen message="LOADING..." />;
  }

  return (
    <>
      {currentView === 'profile-creation' && smartAccountAddress && (
        <ProfileCreation
          walletAddress={smartAccountAddress}
          onSuccess={handleProfileCreated}
          onBecomeMember={handleBecomeMember}
        />
      )}

      {currentView === 'contribution' && supabaseGameData && (
        <ContributionSubmission
          gameNumber={supabaseGameData.gameNumber}
          nextStageTimestamp={supabaseGameData.nextStageTimestamp}
          onSubmitContribution={handleSubmitContribution}
          onNavigate={handleContributionSubmitted}
        />
      )}

      {currentView === 'ranking' && supabaseGameData && (
        <RankingSubmission
          gameNumber={supabaseGameData.gameNumber}
          groupMembers={groupMembers}
          nextSubmissionStageDate={supabaseGameData.nextStageTimestamp}
          onSubmitRanking={handleSubmitRanking}
          onNavigate={handleRankingSubmitted}
        />
      )}

      {currentView === 'profile' && smartAccountAddress && (
        <ProfilePage
          walletAddress={smartAccountAddress}
          respectBalance={respectBalance}
          refreshTrigger={profileRefreshTrigger}
          currentUserAddress={smartAccountAddress}
        />
      )}

      {currentView === 'proposals' && smartAccountAddress && (
        <ProposalsPage
          userAddress={smartAccountAddress}
          isTopMember={isTopMember}
          onVote={handleVoteOnProposal}
        />
      )}
    </>
  );
}

