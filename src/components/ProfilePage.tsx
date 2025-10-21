import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  Link,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LinkIcon from '@mui/icons-material/Link';
import XIcon from '@mui/icons-material/X';
import CancelIcon from '@mui/icons-material/Cancel';
// @ts-ignore - image import
import profileImage from '../assets/profile.jpg';
import {
  getMember,
  getMembers,
  getMemberGameHistory,
  getVouchedForMembers,
  getMemberContribution,
  getMemberRanking,
  getCurrentGameStage,
  updateMemberXAccount,
  type Member,
  type GameResult,
  type Contribution,
  type Ranking,
} from '../lib/supabase-respect';
import { formatRespectDisplay, formatRespectEarned } from '../lib/formatTokens';
import { LoadingScreen, default as LoadingSpinner } from './LoadingSpinner';

interface ProfilePageProps {
  walletAddress: string;
  refreshTrigger?: number; // Timestamp to trigger data refresh
  currentUserAddress?: string; // Address of currently logged in user
  onLoadingChange?: (loading: boolean) => void; // Callback to notify parent of loading state
}

interface ContributionHistory {
  gameNumber: number;
  rank: number;
  contributions: string[];
  links: string[];
  rankedAddresses?: string[];
  respectEarned: number;
}

// Component for individual game history row with expandable details
function GameHistoryRow({ game, memberName }: { game: GameResult; memberName?: string }) {
  const [open, setOpen] = useState(false);
  const [rankedMembers, setRankedMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const navigate = useNavigate();

  const hasDetails = 
    (game.contributions && game.contributions.length > 0) ||
    (game.links && game.links.length > 0) ||
    (game.ranked_addresses && game.ranked_addresses.length > 0);

  // Fetch member data when row is expanded and has ranked addresses
  useEffect(() => {
    if (open && game.ranked_addresses && game.ranked_addresses.length > 0 && rankedMembers.length === 0) {
      setLoadingMembers(true);
      getMembers(game.ranked_addresses)
        .then((members) => {
          // Sort members to match the order in ranked_addresses
          const sortedMembers = game.ranked_addresses!.map(address => 
            members.find(m => m.wallet_address.toLowerCase() === address.toLowerCase())
          ).filter((m): m is Member => m !== undefined);
          setRankedMembers(sortedMembers);
        })
        .catch((error) => {
          console.error('Error fetching ranked members:', error);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [open, game.ranked_addresses, rankedMembers.length]);

  return (
    <>
      <TableRow>
        <TableCell>
          {hasDetails && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={`#${game.game_number}`}
            size="small"
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.6rem',
            }}
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {game.rank === 1 && (
              <EmojiEventsIcon
                sx={{ fontSize: 20, color: '#FFD700' }}
              />
            )}
            {game.rank === 2 && (
              <EmojiEventsIcon
                sx={{ fontSize: 20, color: '#C0C0C0' }}
              />
            )}
            {game.rank === 3 && (
              <EmojiEventsIcon
                sx={{ fontSize: 20, color: '#CD7F32' }}
              />
            )}
            <Typography 
              sx={{ 
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                fontWeight: 'bold' 
              }}
            >
              #{game.rank}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
            <Typography 
            sx={{ 
              color: '#0052FF', 
              fontWeight: 'bold',
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.7rem',
            }}
          >
            {formatRespectEarned(game.respect_earned)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography 
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.6rem',
            }}
          >
            {new Date(game.created_at).toLocaleDateString()}
          </Typography>
        </TableCell>
      </TableRow>
      {hasDetails && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                {/* Contributions Section */}
                {game.contributions && game.contributions.length > 0 && (
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        marginBottom: 1,
                        color: '#0052FF',
                      }}
                    >
                      CONTRIBUTIONS:
                    </Typography>
                    <List dense>
                      {game.contributions.map((contribution, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={contribution}
                            sx={{ fontSize: '0.9rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Links Section */}
                {game.links && game.links.filter((link: string) => link && link.trim() !== '').length > 0 && (
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        marginBottom: 1,
                        color: '#0052FF',
                      }}
                    >
                      LINKS:
                    </Typography>
                    <List dense>
                      {game.links.filter((link: string) => link && link.trim() !== '').map((link, index) => (
                        <ListItem key={index}>
                          <LinkIcon sx={{ fontSize: 16, marginRight: 1 }} />
                          <Link
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontSize: '0.9rem', wordBreak: 'break-all' }}
                          >
                            {link.length > 30 ? `${link.substring(0, 30)}...` : link}
                          </Link>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Ranked Members Section */}
                {game.ranked_addresses && game.ranked_addresses.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        marginBottom: 1,
                        color: '#0052FF',
                      }}
                    >
                      {memberName ? `${memberName.toUpperCase()} RANKED:` : 'MEMBERS RANKED:'}
                    </Typography>
                    {loadingMembers ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', paddingTop: 1, paddingBottom: 2 }}>
                        <LoadingSpinner size={40} />
                      </Box>
                    ) : (
                      <List dense>
                        {rankedMembers.map((member, index) => (
                          <ListItem 
                            key={member.wallet_address}
                            sx={{
                              padding: '8px 16px',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 82, 255, 0.08)',
                              },
                            }}
                            onClick={() => navigate(`/profile/${member.wallet_address}`)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <Typography 
                                sx={{ 
                                  fontFamily: '"Press Start 2P", sans-serif',
                                  fontSize: '0.7rem',
                                  minWidth: '30px',
                                  color: '#0052FF',
                                }}
                              >
                                #{index + 1}
                              </Typography>
                              <Avatar 
                                src={member.profile_url || profileImage} 
                                alt={member.name}
                                sx={{ width: 40, height: 40 }}
                              />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  {member.name}
                                </Typography>
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function ProfilePage({
  walletAddress,
  refreshTrigger,
  currentUserAddress,
  onLoadingChange,
}: ProfilePageProps) {
  const { user, linkTwitter } = usePrivy();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [vouchedFor, setVouchedFor] = useState<Member[]>([]);
  const [currentContribution, setCurrentContribution] = useState<Contribution | null>(null);
  const [currentRanking, setCurrentRanking] = useState<Ranking | null>(null);
  const [currentGameStage, setCurrentGameStage] = useState<'ContributionSubmission' | 'ContributionRanking' | null>(null);
  const [currentGameNumber, setCurrentGameNumber] = useState<number | null>(null);
  const [nextStageTimestamp, setNextStageTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [linkingTwitter, setLinkingTwitter] = useState(false);
  const [rankedMembers, setRankedMembers] = useState<Member[]>([]);
  const [justLinkedTwitter, setJustLinkedTwitter] = useState(false);
  
  // Check if viewing own profile - use currentUserAddress if provided, fallback to Privy wallet
  const isOwnProfile = currentUserAddress 
    ? currentUserAddress.toLowerCase() === walletAddress.toLowerCase()
    : user?.wallet?.address?.toLowerCase() === walletAddress.toLowerCase();

  // Get Twitter account from Privy user object (reactive - updates automatically)
  const twitterAccount = user?.twitter?.username 
    ? (user.twitter.username.startsWith('@') ? user.twitter.username : `@${user.twitter.username}`)
    : '';
  const twitterVerified = (user?.twitter as any)?.verified || false;

  // Debug logging
  useEffect(() => {
    console.log('📊 ProfilePage state:', {
      walletAddress,
      currentUserAddress,
      isOwnProfile,
      twitterAccount,
      memberXAccount: member?.x_account,
      justLinkedTwitter,
      hasUser: !!user,
      hasTwitter: !!user?.twitter,
    });
  }, [walletAddress, currentUserAddress, isOwnProfile, twitterAccount, member?.x_account, justLinkedTwitter, user?.twitter]);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    loadProfileData();
  }, [walletAddress, refreshTrigger]);

  // Watch for Twitter account and sync with database
  // This handles two cases:
  // 1. User just clicked link button and Twitter data arrives
  // 2. User already has Twitter linked in Privy but it's missing from database
  useEffect(() => {
    const saveTwitterToDatabase = async () => {
      // Only save if:
      // 1. Twitter account is available from Privy
      // 2. It's the user's own profile
      // 3. Member data is loaded
      // 4. Member doesn't already have this X account in database
      // 5. EITHER: User just clicked link button OR Twitter exists but not in DB
      if (
        twitterAccount && 
        isOwnProfile && 
        member && 
        member.x_account !== twitterAccount &&
        (justLinkedTwitter || (twitterAccount && !member.x_account))
      ) {
        try {
          console.log('🔗 Syncing Twitter account to database:', {
            walletAddress,
            twitterAccount,
            twitterVerified,
            privyId: user?.id,
            reason: justLinkedTwitter ? 'User just linked' : 'Auto-sync (already linked in Privy)'
          });

          await updateMemberXAccount(
            walletAddress,
            twitterAccount,
            twitterVerified,
            user?.id || ''
          );

          console.log('✅ X account saved to database successfully!');
          
          // Reset the flag
          setJustLinkedTwitter(false);
          
          // Reload profile data to show the updated X account
          await loadProfileData();
        } catch (err: any) {
          console.error('❌ Failed to save X account:', err);
          setError(err.message || 'Failed to save X account. Please try again.');
          setJustLinkedTwitter(false);
        }
      }
    };

    saveTwitterToDatabase();
  }, [justLinkedTwitter, twitterAccount, isOwnProfile, member, walletAddress, twitterVerified, user?.id]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current game info
      const gameStageData = await getCurrentGameStage();
      const gameNum = gameStageData?.current_game_number || null;
      const gameStage = gameStageData?.current_stage || null;
      setCurrentGameNumber(gameNum);
      setCurrentGameStage(gameStage);
      setNextStageTimestamp(gameStageData?.next_stage_timestamp || null);

      const [memberData, historyData, vouchedData, contributionData, rankingData] = await Promise.all([
        getMember(walletAddress),
        getMemberGameHistory(walletAddress),
        getVouchedForMembers(walletAddress),
        gameNum ? getMemberContribution(walletAddress, gameNum) : Promise.resolve(null),
        gameNum ? getMemberRanking(walletAddress, gameNum) : Promise.resolve(null),
      ]);

      setMember(memberData);
      setGameHistory(historyData);
      setVouchedFor(vouchedData);
      setCurrentContribution(contributionData);
      setCurrentRanking(rankingData);

      // If ranking exists, fetch the ranked members
      if (rankingData && rankingData.ranked_addresses && rankingData.ranked_addresses.length > 0) {
        const members = await getMembers(rankingData.ranked_addresses);
        // Sort members to match the order in ranked_addresses
        const sortedMembers = rankingData.ranked_addresses.map(address => 
          members.find(m => m.wallet_address.toLowerCase() === address.toLowerCase())
        ).filter((m): m is Member => m !== undefined);
        setRankedMembers(sortedMembers);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Render empty fragment while loading - parent wrapper will show loading screen overlay
  // This allows useEffect to run and load data
  if (loading) {
    return <></>;
  }

  // Show error if we're done loading and there's an error
  if (error || !member) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">{error || 'Member not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: '1px 3rem',
      }}
    >
      <Box sx={{ width: 960, margin: '-45px auto 0' }}>
        {/* Profile Header */}
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            marginBottom: 3,
            borderRadius: 4,
            width: 960,
            minWidth: 960,
            maxWidth: 960,
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              alignItems: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Avatar
              src={member.profile_url}
              alt={member.name}
              sx={{
                width: 150,
                height: 150,
                borderRadius: 4,
                flexShrink: 0,
              }}
            />

            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, minWidth: 0 }}>
              {member.is_approved && (
                <Chip
                  label="APPROVED MEMBER"
                  color="success"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.5rem',
                    marginBottom: 1,
                  }}
                />
              )}
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1.5rem',
                  marginBottom: 1,
                }}
              >
                {member.name}
              </Typography>

              {/* X Account Display */}
              {/* Show X account if in database OR if available from Privy and it's own profile */}
              {(member.x_account || (isOwnProfile && twitterAccount)) ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    marginBottom: 2,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <XIcon sx={{ fontSize: 16, color: '#000' }} />
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: '#000',
                    }}
                  >
                    :
                  </Typography>
                  <Link
                    href={`https://x.com/${(member.x_account || twitterAccount).replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#1da1f2',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {member.x_account || twitterAccount}
                  </Link>
                  <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                </Box>
              ) : isOwnProfile ? (
                <Box sx={{ marginBottom: 2 }}>
                  <Button
                    onClick={async () => {
                      try {
                        setLinkingTwitter(true);
                        setError(null);
                        console.log('🔗 Starting X account linking...');
                        
                        // Set flag to indicate user clicked link button
                        setJustLinkedTwitter(true);
                        
                        // Trigger Privy OAuth flow
                        // The useEffect will handle saving to database once user.twitter updates
                        await linkTwitter();
                        
                        console.log('✅ Privy linkTwitter() completed, waiting for user object to update...');
                      } catch (err) {
                        console.error('❌ Failed to link Twitter:', err);
                        setError('Failed to link Twitter account. Please try again.');
                        setJustLinkedTwitter(false);
                      } finally {
                        setLinkingTwitter(false);
                      }
                    }}
                    disabled={linkingTwitter}
                    variant="outlined"
                    endIcon={linkingTwitter ? <LoadingSpinner size={20} /> : <XIcon />}
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      padding: '0.75rem 1.5rem',
                      borderColor: '#000',
                      color: '#000',
                      '&:hover': {
                        borderColor: '#333',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                      },
                    }}
                  >
                    {linkingTwitter ? 'CONNECTING...' : 'CONNECT'}
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    marginBottom: 2,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <XIcon sx={{ fontSize: 16, color: '#000' }} />
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: '#000',
                    }}
                  >
                    :
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#9e9e9e',
                    }}
                  >
                    missing
                  </Typography>
                  <CancelIcon sx={{ fontSize: 18, color: '#f44336' }} />
                </Box>
              )}

              {member.description && (
                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 2,
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {member.description}
                </Typography>
              )}

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                {!member.is_approved && (
                  <Chip
                    label="PENDING APPROVAL"
                    color="warning"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                    }}
                  />
                )}
                {member.is_banned && (
                  <Chip
                    label="BANNED"
                    color="error"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Stats Cards - Right column */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'flex' },
                flexDirection: { xs: 'row', md: 'column' },
                gap: 1,
                flexShrink: 0,
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Card sx={{ minWidth: 180, width: 180, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', padding: '12px 10px !important' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      marginBottom: 0.5,
                      lineHeight: 1.4,
                    }}
                  >
                    RESPECT SCORE
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '1rem',
                      color: '#0052FF',
                    }}
                  >
                    {formatRespectDisplay(member.average_respect)}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 180, width: 180, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', padding: '12px 10px !important' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      marginBottom: 0.5,
                      lineHeight: 1.4,
                    }}
                  >
                    $RESPECT BALANCE
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '1rem',
                      color: '#FFD700',
                    }}
                  >
                    {formatRespectDisplay(member.total_respect_earned, true)}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 180, width: 180, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', padding: '12px 10px !important' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      marginBottom: 0.5,
                      lineHeight: 1.4,
                    }}
                  >
                    GAMES COMPLETED
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '1rem',
                      color: '#4CAF50',
                    }}
                  >
                    {gameHistory.length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            height: 550,
            width: 960,
            minWidth: 960,
            maxWidth: 960,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              gridRow: 1,
              '& .MuiTab-root': {
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
              },
            }}
          >
              <Tab label="CURRENT GAME" />
              <Tab label="GAME HISTORY" />
              <Tab label="VOUCHED FOR" />
            </Tabs>

          {/* Current Game Tab */}
          {tabValue === 0 && (
            <Box sx={{ 
              padding: 3, 
              gridRow: 2, 
              overflow: 'auto', 
              minHeight: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1rem',
                  marginBottom: 3,
                }}
              >
                CURRENT GAME #{currentGameNumber || '...'}
              </Typography>

              {/* Ranking Submission Section - Show first */}
              {currentGameStage === 'ContributionRanking' && currentRanking && rankedMembers.length > 0 && (
                <Card
                  sx={{
                    backgroundColor: '#f0fff4',
                    borderLeft: '4px solid #22c55e',
                    marginBottom: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}>
                      <CheckCircleIcon sx={{ color: '#22c55e' }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.9rem',
                          color: '#22c55e',
                        }}
                      >
                        RANKING SUBMITTED
                      </Typography>
                    </Box>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.75rem',
                        marginBottom: 2,
                        color: '#000',
                      }}
                    >
                      RANKING:
                    </Typography>

                    <List dense>
                      {rankedMembers.map((rankedMember, index) => (
                        <ListItem
                          key={rankedMember.wallet_address}
                          onClick={() => navigate(`/profile/${rankedMember.wallet_address}`)}
                          sx={{
                            paddingY: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: '#fff',
                            marginBottom: 1,
                            borderRadius: 1,
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#f9fafb',
                              borderColor: '#22c55e',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.7rem',
                              color: '#0052FF',
                              minWidth: '40px',
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          <Avatar
                            src={rankedMember.profile_url}
                            alt={rankedMember.name}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: '"Press Start 2P", sans-serif',
                                fontSize: '0.7rem',
                              }}
                            >
                              {rankedMember.name}
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>

                    <Box
                      sx={{
                        marginTop: 2,
                        padding: 2,
                        backgroundColor: '#fff',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          lineHeight: 1.8,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            animation: 'hourglass-spin 2s ease-in-out infinite',
                            '@keyframes hourglass-spin': {
                              '0%, 100%': {
                                transform: 'rotate(0deg)',
                              },
                              '50%': {
                                transform: 'rotate(180deg)',
                              },
                            },
                          }}
                        >
                          ⏳
                        </Box>{' '}
                        The ranking stage will end in{' '}
                        {nextStageTimestamp ? (
                          (() => {
                            const timeDiff = new Date(nextStageTimestamp).getTime() - Date.now();
                            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                            
                            if (days > 0) {
                              return <strong>{days} {days === 1 ? 'day' : 'days'} {hours} {hours === 1 ? 'hour' : 'hours'}</strong>;
                            } else if (hours > 0) {
                              return <strong>{hours} {hours === 1 ? 'hour' : 'hours'} {minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                            } else {
                              return <strong>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                            }
                          })()
                        ) : (
                          'calculating...'
                        )}
                        , results will be available on the profile page in GAME HISTORY.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {currentContribution ? (
                <Card
                  sx={{
                    backgroundColor: '#f0f9ff',
                    borderLeft: '4px solid #0052FF',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        marginBottom: 2,
                      }}
                    >
                      <CheckCircleIcon sx={{ color: '#0052FF', fontSize: 24 }} />
                      <Typography
                        sx={{
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.8rem',
                          color: '#0052FF',
                        }}
                      >
                        CONTRIBUTION SUBMITTED
                      </Typography>
                    </Box>

                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        marginBottom: 2,
                        color: 'text.secondary',
                      }}
                    >
                      Submitted on{' '}
                      {new Date(currentContribution.block_timestamp).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </Typography>

                    <Divider sx={{ marginBottom: 2 }} />

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.75rem',
                        marginBottom: 1.5,
                      }}
                    >
                      CONTRIBUTIONS:
                    </Typography>

                    <List sx={{ paddingLeft: 2 }}>
                      {currentContribution.contributions.map(
                        (contribution, index) => (
                          <ListItem key={index} sx={{ paddingY: 1, display: 'block' }}>
                            <Typography
                              sx={{
                                fontFamily: '"Press Start 2P", sans-serif',
                                fontSize: '0.65rem',
                                color: '#0052FF',
                                marginBottom: 0.5,
                              }}
                            >
                              [{index + 1}]
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                marginBottom: 0.5,
                                lineHeight: 1.5,
                              }}
                            >
                              {contribution}
                            </Typography>
                            {currentContribution.links[index] && (
                              <Link
                                href={currentContribution.links[index]}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  fontSize: '0.85rem',
                                  display: 'block',
                                }}
                              >
                                {currentContribution.links[index].substring(0, 30)}
                                {currentContribution.links[index].length > 30 && '...'}
                              </Link>
                            )}
                          </ListItem>
                        )
                      )}
                    </List>

                    {currentGameStage === 'ContributionSubmission' && (
                      <Box
                        sx={{
                          marginTop: 2,
                          padding: 2,
                          backgroundColor: '#fff',
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            lineHeight: 1.8,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              animation: 'hourglass-spin 2s ease-in-out infinite',
                              '@keyframes hourglass-spin': {
                                '0%, 100%': {
                                  transform: 'rotate(0deg)',
                                },
                                '50%': {
                                  transform: 'rotate(180deg)',
                                },
                              },
                            }}
                          >
                            ⏳
                          </Box>{' '}
                          Waiting for contribution submission stage to complete. Game resumes with contribution rankings in{' '}
                          {nextStageTimestamp ? (
                            (() => {
                              const timeDiff = new Date(nextStageTimestamp).getTime() - Date.now();
                              const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                              
                              if (days > 0) {
                                return <strong>{days} {days === 1 ? 'day' : 'days'} {hours} {hours === 1 ? 'hour' : 'hours'}</strong>;
                              } else if (hours > 0) {
                                return <strong>{hours} {hours === 1 ? 'hour' : 'hours'} {minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                              } else {
                                return <strong>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                              }
                            })()
                          ) : (
                            'calculating...'
                          )}
                          . All the players will be distributed randomly into small groups to rank each others contributions.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Alert severity="info" sx={{ marginBottom: 2 }}>
                    <Typography 
                      sx={{ 
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        lineHeight: 1.8,
                      }}
                    >
                      Not playing, member has not submitted contributions for this game.
                    </Typography>
                  </Alert>

                  {currentGameStage === 'ContributionRanking' && nextStageTimestamp && (
                    <Alert severity="info" sx={{ '& .MuiAlert-icon': { display: 'none' }, '& .MuiAlert-message': { padding: 0 } }}>
                      <Typography 
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.7rem',
                          lineHeight: 1.8,
                          textAlign: 'left',
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            animation: 'hourglass-spin 2s ease-in-out infinite',
                            '@keyframes hourglass-spin': {
                              '0%, 100%': {
                                transform: 'rotate(0deg)',
                              },
                              '50%': {
                                transform: 'rotate(180deg)',
                              },
                            },
                          }}
                        >
                          ⏳
                        </Box>
                        {' '}Come back to play in{' '}
                        {(() => {
                          const timeDiff = new Date(nextStageTimestamp).getTime() - Date.now();
                          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                          
                          if (days > 0) {
                            return <strong>{days} {days === 1 ? 'day' : 'days'} {hours} {hours === 1 ? 'hour' : 'hours'}</strong>;
                          } else if (hours > 0) {
                            return <strong>{hours} {hours === 1 ? 'hour' : 'hours'} {minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                          } else {
                            return <strong>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</strong>;
                          }
                        })()}
                        , when the next contribution submission stage starts.
                      </Typography>
                    </Alert>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Game History Tab */}
          {tabValue === 1 && (
            <Box sx={{ 
              padding: 3, 
              gridRow: 2, 
              overflow: 'auto', 
              minHeight: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1rem',
                  marginBottom: 3,
                }}
              >
                HISTORICAL GAME DATA
              </Typography>

              {gameHistory.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.7rem',
                          }}
                        />
                        <TableCell
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.7rem',
                          }}
                        >
                          GAME #
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.7rem',
                          }}
                        >
                          RANK
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.7rem',
                          }}
                        >
                          RESPECT EARNED
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.7rem',
                          }}
                        >
                          DATE
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gameHistory.map((game) => (
                        <GameHistoryRow key={game.game_number} game={game} memberName={member?.name} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert 
                  severity="info"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                      lineHeight: 1,
                    }}
                  >
                    No game history yet
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Vouched For Tab */}
          {tabValue === 2 && (
            <Box sx={{ 
              padding: 3, 
              gridRow: 2, 
              overflow: 'auto', 
              minHeight: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1rem',
                  marginBottom: 3,
                }}
              >
                MEMBERS VOUCHED FOR
              </Typography>

              {vouchedFor.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {vouchedFor.map((vouchedMember) => (
                    <Card key={vouchedMember.wallet_address}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            marginBottom: 1,
                          }}
                        >
                          <Avatar
                            src={vouchedMember.profile_url}
                            alt={vouchedMember.name}
                            sx={{ width: 50, height: 50, borderRadius: 2 }}
                          />
                          <Box>
                            <Typography
                              sx={{
                                fontFamily: '"Press Start 2P", sans-serif',
                                fontSize: '0.7rem',
                              }}
                            >
                              {vouchedMember.name}
                            </Typography>
                            {vouchedMember.x_account && (
                              <Typography
                                variant="body2"
                                sx={{ fontSize: '0.75rem', color: '#1da1f2' }}
                              >
                                {vouchedMember.x_account}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Chip
                          label={`RESPECT: ${formatRespectDisplay(vouchedMember.average_respect)}`}
                          size="small"
                          sx={{
                            fontFamily: '"Press Start 2P", sans-serif',
                            fontSize: '0.55rem',
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert 
                  severity="info"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                      lineHeight: 1,
                    }}
                  >
                    Haven't vouched for any members yet
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

