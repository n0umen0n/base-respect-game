import { useState, useEffect } from 'react';
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
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  getMember,
  getMemberGameHistory,
  getVouchedForMembers,
  type Member,
  type GameResult,
} from '../lib/supabase-respect';

interface ProfilePageProps {
  walletAddress: string;
  respectBalance?: number; // From RespectToken contract
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
}: ProfilePageProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [vouchedFor, setVouchedFor] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadProfileData();
  }, [walletAddress]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [memberData, historyData, vouchedData] = await Promise.all([
        getMember(walletAddress),
        getMemberGameHistory(walletAddress),
        getVouchedForMembers(walletAddress),
      ]);

      setMember(memberData);
      setGameHistory(historyData);
      setVouchedFor(vouchedData);
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
        padding: 3,
      }}
    >
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Profile Header */}
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            marginBottom: 3,
            borderRadius: 4,
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
              }}
            />

            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
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

              {member.x_account && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    marginBottom: 2,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <Link
                    href={`https://x.com/${member.x_account.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontSize: '1rem',
                      color: '#1da1f2',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {member.x_account}
                  </Link>
                  {member.x_verified && (
                    <VerifiedIcon sx={{ fontSize: 20, color: '#1da1f2' }} />
                  )}
                </Box>
              )}

              {member.description && (
                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 2,
                    lineHeight: 1.6,
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
                {member.is_approved ? (
                  <Chip
                    label="APPROVED"
                    color="success"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                    }}
                  />
                ) : (
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

            {/* Stats Cards */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                gap: 2,
              }}
            >
              <Card sx={{ minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      marginBottom: 1,
                    }}
                  >
                    RESPECT SCORE
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      color: '#0052FF',
                    }}
                  >
                    {member.average_respect}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      marginBottom: 1,
                    }}
                  >
                    RESPECT BALANCE
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      color: '#FFD700',
                    }}
                  >
                    {respectBalance}
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
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
              },
            }}
          >
            <Tab label="GAME HISTORY" />
            <Tab label="VOUCHED FOR" />
          </Tabs>

          {/* Game History Tab */}
          {tabValue === 0 && (
            <Box sx={{ padding: 3 }}>
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
                <Alert severity="info">No game history yet</Alert>
              )}

              <Box sx={{ marginTop: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.8rem',
                    marginBottom: 2,
                  }}
                >
                  TOTAL STATS
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Card sx={{ flex: 1, minWidth: 200 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Games Played
                      </Typography>
                      <Typography variant="h5">
                        {gameHistory.length}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ flex: 1, minWidth: 200 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total Respect Earned
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#0052FF' }}>
                        {member.total_respect_earned}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ flex: 1, minWidth: 200 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Average Respect
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#FFD700' }}>
                        {member.average_respect}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}

          {/* Vouched For Tab */}
          {tabValue === 1 && (
            <Box sx={{ padding: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1rem',
                  marginBottom: 3,
                }}
              >
                MEMBERS YOU VOUCHED FOR
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
                <Alert severity="info">
                  You haven't vouched for any members yet
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

