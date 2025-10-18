import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
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
  CircularProgress,
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
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import XIcon from '@mui/icons-material/X';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  getMember,
  getMemberGameHistory,
  getVouchedForMembers,
  getMemberContribution,
  getCurrentGameStage,
  type Member,
  type GameResult,
  type Contribution,
} from '../lib/supabase-respect';

interface ProfilePageProps {
  walletAddress: string;
  respectBalance?: number; // From RespectToken contract
  refreshTrigger?: number; // Timestamp to trigger data refresh
  currentUserAddress?: string; // Address of currently logged in user
}

interface ContributionHistory {
  gameNumber: number;
  rank: number;
  contributions: string[];
  links: string[];
  rankedAddresses?: string[];
  respectEarned: number;
}

export default function ProfilePage({
  walletAddress,
  respectBalance = 0,
  refreshTrigger,
  currentUserAddress,
}: ProfilePageProps) {
  const { user, linkTwitter } = usePrivy();
  const [member, setMember] = useState<Member | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [vouchedFor, setVouchedFor] = useState<Member[]>([]);
  const [currentContribution, setCurrentContribution] = useState<Contribution | null>(null);
  const [currentGameNumber, setCurrentGameNumber] = useState<number | null>(null);
  const [nextStageTimestamp, setNextStageTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [linkingTwitter, setLinkingTwitter] = useState(false);
  
  // Check if viewing own profile - use currentUserAddress if provided, fallback to Privy wallet
  const isOwnProfile = currentUserAddress 
    ? currentUserAddress.toLowerCase() === walletAddress.toLowerCase()
    : user?.wallet?.address?.toLowerCase() === walletAddress.toLowerCase();

  useEffect(() => {
    loadProfileData();
  }, [walletAddress, refreshTrigger]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current game info
      const gameStageData = await getCurrentGameStage();
      const gameNum = gameStageData?.current_game_number || null;
      setCurrentGameNumber(gameNum);
      setNextStageTimestamp(gameStageData?.next_stage_timestamp || null);

      const [memberData, historyData, vouchedData, contributionData] = await Promise.all([
        getMember(walletAddress),
        getMemberGameHistory(walletAddress),
        getVouchedForMembers(walletAddress),
        gameNum ? getMemberContribution(walletAddress, gameNum) : Promise.resolve(null),
      ]);

      setMember(memberData);
      setGameHistory(historyData);
      setVouchedFor(vouchedData);
      setCurrentContribution(contributionData);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
              {member.x_account ? (
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
                    href={`https://x.com/${member.x_account.replace('@', '')}`}
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
                    {member.x_account}
                  </Link>
                  <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                </Box>
              ) : isOwnProfile ? (
                <Box sx={{ marginBottom: 2 }}>
                  <Button
                    onClick={async () => {
                      try {
                        setLinkingTwitter(true);
                        await linkTwitter();
                        // Reload profile data after linking
                        await loadProfileData();
                      } catch (err) {
                        console.error('Failed to link Twitter:', err);
                      } finally {
                        setLinkingTwitter(false);
                      }
                    }}
                    disabled={linkingTwitter}
                    variant="outlined"
                    startIcon={linkingTwitter ? <CircularProgress size={20} /> : <XIcon />}
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
                    {linkingTwitter ? 'CONNECTING...' : 'CONNECT X'}
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
                    {member.average_respect}
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
                    {respectBalance}
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
            height: 500,
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
                      YOUR CONTRIBUTIONS:
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
                        }}
                      >
                        ⏳ Waiting for contribution submission stage to complete. Please comeback for contribution ranking phase in{' '}
                        {nextStageTimestamp ? (
                          <>
                            {Math.ceil(
                              (new Date(nextStageTimestamp).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                            )}{' '}
                            days
                          </>
                        ) : (
                          'calculating...'
                        )}
                        .
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info">
                  <Typography sx={{ fontSize: '0.9rem' }}>
                    No contribution submitted for the current game yet.
                    {member?.is_approved
                      ? ' Visit the Contribution Submission page to submit your work!'
                      : ' You need to be approved by the community first.'}
                  </Typography>
                </Alert>
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
                        <TableRow key={game.game_number}>
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
                              <Typography sx={{ fontWeight: 'bold' }}>
                                #{game.rank}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#0052FF', fontWeight: 'bold' }}>
                              {game.respect_earned}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(game.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
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
                          label={`RESPECT: ${vouchedMember.average_respect}`}
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

