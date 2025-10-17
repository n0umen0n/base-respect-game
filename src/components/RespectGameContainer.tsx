import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { CircularProgress, Box } from '@mui/material';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';
import { getMember, getCurrentGameStage, getMemberContribution, getMemberGroup } from '../lib/supabase-respect';
import ProfileCreation from './ProfileCreation';
import ContributionSubmission from './ContributionSubmission';
import RankingSubmission from './RankingSubmission';
import ProfilePage from './ProfilePage';
import ProposalsPage from './ProposalsPage';

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

  useEffect(() => {
    if (!walletLoading && !gameLoading && authenticated && smartAccountAddress) {
      determineView();
    }
  }, [walletLoading, gameLoading, authenticated, smartAccountAddress, memberInfo, gameState]);

  const determineView = async () => {
    try {
      setLoading(true);

      // Check if user is a member
      if (!memberInfo?.exists) {
        setCurrentView('profile-creation');
        setLoading(false);
        return;
      }

      // Check if member is banned
      if (memberInfo.isBanned) {
        setCurrentView('profile');
        setLoading(false);
        return;
      }

      // If not approved, show profile
      if (!memberInfo.isApproved) {
        setCurrentView('profile');
        setLoading(false);
        return;
      }

      // Determine view based on game stage
      if (gameState) {
        const { currentGameNumber, currentStage } = gameState;

        if (currentStage === 0) {
          // Contribution Submission Stage
          // Check if user already submitted
          const contribution = await getMemberContribution(
            smartAccountAddress!,
            currentGameNumber
          );

          if (contribution) {
            // Already submitted, show profile
            setCurrentView('profile');
          } else {
            // Show contribution form
            setCurrentView('contribution');
          }
        } else {
          // Ranking Stage
          // Get user's group and check if already ranked
          try {
            const group = await getMyGroup(currentGameNumber);
            
            if (group && group.members.length > 0) {
              // Fetch member details and contributions for all group members
              const membersWithData = await Promise.all(
                group.members.map(async (memberAddress: string) => {
                  const memberData = await getMember(memberAddress);
                  const contributionData = await getContribution(
                    currentGameNumber,
                    memberAddress
                  );

                  return {
                    address: memberAddress,
                    name: memberData?.name || 'Unknown',
                    profileUrl: memberData?.profile_url,
                    xAccount: memberData?.x_account,
                    xVerified: memberData?.x_verified || false,
                    contributions: contributionData?.contributions || [],
                    links: contributionData?.links || [],
                  };
                })
              );

              setGroupMembers(membersWithData);
              setCurrentView('ranking');
            } else {
              // No group assigned yet
              setCurrentView('profile');
            }
          } catch (error) {
            console.error('Error fetching group:', error);
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
    await determineView();
  };

  const handleContributionSubmitted = async () => {
    await refreshData();
    setCurrentView('profile');
  };

  const handleRankingSubmitted = async () => {
    await refreshData();
    setCurrentView('profile');
  };

  const handleBecomeMember = async (
    name: string,
    profileUrl: string,
    description: string,
    xAccount: string
  ) => {
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
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!currentView) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      {currentView === 'profile-creation' && (
        <ProfileCreation
          onSuccess={handleProfileCreated}
          onBecomeMember={handleBecomeMember}
        />
      )}

      {currentView === 'contribution' && gameState && (
        <ContributionSubmission
          gameNumber={gameState.currentGameNumber}
          nextStageTimestamp={new Date(gameState.nextStageTimestamp * 1000)}
          onSubmitContribution={handleSubmitContribution}
          onNavigate={handleContributionSubmitted}
        />
      )}

      {currentView === 'ranking' && gameState && (
        <RankingSubmission
          gameNumber={gameState.currentGameNumber}
          groupMembers={groupMembers}
          nextSubmissionStageDate={new Date(gameState.nextStageTimestamp * 1000)}
          onSubmitRanking={handleSubmitRanking}
          onNavigate={handleRankingSubmitted}
        />
      )}

      {currentView === 'profile' && smartAccountAddress && (
        <ProfilePage
          walletAddress={smartAccountAddress}
          respectBalance={respectBalance}
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

