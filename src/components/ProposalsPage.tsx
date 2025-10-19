import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { LoadingScreen, default as LoadingSpinner } from './LoadingSpinner';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import CreateProposalDialog, {
  type BanProposalData,
  type TransferProposalData,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
} from './CreateProposalDialog';
import {
  getLiveProposals,
  getHistoricalProposals,
  type LiveProposal,
} from '../lib/supabase-respect';
import { useTreasuryBalances } from '../hooks/useTreasuryBalances';
import { CONTRACTS } from '../config/contracts.config';

interface ProposalsPageProps {
  userAddress: string;
  isTopMember: boolean;
  onVote: (proposalId: number, voteFor: boolean) => Promise<void>;
  onCreateBanProposal?: (targetMember: string, description: string) => Promise<void>;
  onCreateTransferProposal?: (
    token: string,
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number,
    description: string
  ) => Promise<void>;
}

const PROPOSAL_COLORS = {
  ApproveMember: {
    bg: '#e8f5e9',
    border: '#4caf50',
    text: '#2e7d32',
  },
  BanMember: {
    bg: '#ffebee',
    border: '#f44336',
    text: '#c62828',
  },
  ExecuteTransactions: {
    bg: '#e3f2fd',
    border: '#2196f3',
    text: '#1565c0',
  },
};

const PROPOSAL_THRESHOLDS = {
  ApproveMember: 2,
  BanMember: 3,
  ExecuteTransactions: 4,
};

function ProposalCard({
  proposal,
  isTopMember,
  onVoteClick,
}: {
  proposal: LiveProposal;
  isTopMember: boolean;
  onVoteClick: (proposalId: number, voteFor: boolean) => void;
}) {
  const colors = PROPOSAL_COLORS[proposal.proposal_type as keyof typeof PROPOSAL_COLORS] || PROPOSAL_COLORS.ApproveMember;
  const threshold = PROPOSAL_THRESHOLDS[proposal.proposal_type as keyof typeof PROPOSAL_THRESHOLDS] || 2;
  const totalVotes = proposal.votes_for + proposal.votes_against;
  const progress = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;

  return (
    <Card
      sx={{
        marginBottom: 2,
        borderLeft: `4px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
              <Chip
                label={`#${proposal.proposal_id}`}
                size="small"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.6rem',
                  backgroundColor: colors.border,
                  color: 'white',
                }}
              />
              <Chip
                label={proposal.proposal_type.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                size="small"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.6rem',
                  backgroundColor: colors.text,
                  color: 'white',
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.9rem',
                marginBottom: 1,
                color: colors.text,
              }}
            >
              {proposal.target_member_name || 'General Proposal'}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                marginBottom: 2,
                lineHeight: 1.6,
              }}
            >
              {proposal.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, fontSize: '0.85rem', color: 'text.secondary' }}>
              <Typography variant="caption">
                Proposed by: <strong>{proposal.proposer_name}</strong>
              </Typography>
              <Typography variant="caption">
                {new Date(proposal.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {isTopMember && proposal.status === 'Pending' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ThumbUpIcon />}
                onClick={() => onVoteClick(proposal.proposal_id, true)}
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.6rem',
                }}
              >
                FOR
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<ThumbDownIcon />}
                onClick={() => onVoteClick(proposal.proposal_id, false)}
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.6rem',
                }}
              >
                AGAINST
              </Button>
            </Box>
          )}
        </Box>

        {/* Vote Progress */}
        <Box sx={{ marginTop: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.6rem',
              }}
            >
              VOTES: {proposal.votes_for} FOR / {proposal.votes_against} AGAINST
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.6rem',
                color: colors.text,
              }}
            >
              NEEDED: {threshold}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((proposal.votes_for / threshold) * 100, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: colors.border,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ProposalsPage({
  userAddress,
  isTopMember,
  onVote,
  onCreateBanProposal,
  onCreateTransferProposal,
}: ProposalsPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [liveProposals, setLiveProposals] = useState<LiveProposal[]>([]);
  const [historicalProposals, setHistoricalProposals] = useState<LiveProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteDialog, setVoteDialog] = useState<{
    open: boolean;
    proposalId: number | null;
    voteFor: boolean;
  }>({ open: false, proposalId: null, voteFor: false });
  const [voting, setVoting] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [createProposalDialogOpen, setCreateProposalDialogOpen] = useState(false);

  // Fetch treasury balances
  const { balances: treasuryBalances, loading: treasuryLoading } = useTreasuryBalances(CONTRACTS.EXECUTOR);

  // Log user status
  useEffect(() => {
    console.log('=== PROPOSALS PAGE STATUS ===');
    console.log('User Address:', userAddress || 'Not logged in');
    console.log('Is Top Member:', isTopMember);
    console.log('Can Create Proposals:', isTopMember && userAddress !== '');
    console.log('============================');
  }, [userAddress, isTopMember]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACTS.EXECUTOR);
      setCopySnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCreateProposal = async (
    type: 'ban' | 'transfer',
    data: BanProposalData | TransferProposalData
  ) => {
    try {
      if (type === 'ban') {
        const banData = data as BanProposalData;
        if (onCreateBanProposal) {
          await onCreateBanProposal(banData.targetMember, banData.description);
        } else {
          throw new Error('Ban proposal creation not available');
        }
      } else {
        const transferData = data as TransferProposalData;
        const tokenAddress = transferData.token === 'ETH' 
          ? '0x0000000000000000000000000000000000000000' 
          : TOKEN_ADDRESSES[transferData.token as keyof typeof TOKEN_ADDRESSES];
        const decimals = TOKEN_DECIMALS[transferData.token];
        
        if (onCreateTransferProposal) {
          await onCreateTransferProposal(
            transferData.token,
            tokenAddress,
            transferData.recipient,
            transferData.amount,
            decimals,
            transferData.description
          );
        } else {
          throw new Error('Transfer proposal creation not available');
        }
      }
      
      // Reload proposals after creation
      await loadProposals();
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const [live, historical] = await Promise.all([
        getLiveProposals(),
        getHistoricalProposals(),
      ]);

      setLiveProposals(live);
      setHistoricalProposals(historical);
    } catch (err: any) {
      console.error('Error loading proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (proposalId: number, voteFor: boolean) => {
    setVoteDialog({ open: true, proposalId, voteFor });
  };

  const handleVoteConfirm = async () => {
    if (voteDialog.proposalId === null) return;

    try {
      setVoting(true);
      await onVote(voteDialog.proposalId, voteDialog.voteFor);
      setVoteDialog({ open: false, proposalId: null, voteFor: false });
      // Reload proposals after voting
      await loadProposals();
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.message || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="LOADING PROPOSALS..." />;
  }

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          padding: 3,
        }}
      >
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1.8rem',
              }}
            >
              PROPOSALS
            </Typography>
            {userAddress && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateProposalDialogOpen(true)}
                disabled={!isTopMember}
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  backgroundColor: isTopMember ? '#4caf50' : undefined,
                  '&:hover': {
                    backgroundColor: isTopMember ? '#45a049' : undefined,
                  },
                }}
              >
                CREATE
              </Button>
            )}
          </Box>

          {!isTopMember && (
            <Alert 
              severity="info" 
              sx={{ 
                marginBottom: 3,
                '& .MuiAlert-message': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  lineHeight: 1.8,
                }
              }}
            >
              Only top 6 members with highest RESPECT SCORE can vote
            </Alert>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                marginBottom: 3,
                '& .MuiAlert-message': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  lineHeight: 1.8,
                }
              }}
            >
              {error}
            </Alert>
          )}

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
              <Tab label={`LIVE (${liveProposals.length})`} />
              <Tab label={`HISTORICAL (${historicalProposals.length})`} />
            </Tabs>

            {/* Live Proposals Tab */}
            {tabValue === 0 && (
              <Box sx={{ padding: 3 }}>
                {liveProposals.length > 0 ? (
                  liveProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.proposal_id}
                      proposal={proposal}
                      isTopMember={isTopMember}
                      onVoteClick={handleVoteClick}
                    />
                  ))
                ) : (
                  <Alert 
                    severity="info"
                    sx={{ 
                      '& .MuiAlert-message': {
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        lineHeight: 1.8,
                      }
                    }}
                  >
                    No live proposals at the moment
                  </Alert>
                )}
              </Box>
            )}

            {/* Historical Proposals Tab */}
            {tabValue === 1 && (
              <Box sx={{ padding: 3 }}>
                {historicalProposals.length > 0 ? (
                  historicalProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.proposal_id}
                      proposal={proposal}
                      isTopMember={false}
                      onVoteClick={() => {}}
                    />
                  ))
                ) : (
                  <Alert 
                    severity="info"
                    sx={{ 
                      '& .MuiAlert-message': {
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.7rem',
                        lineHeight: 1.8,
                      }
                    }}
                  >
                    No historical proposals yet
                  </Alert>
                )}
              </Box>
            )}
          </Paper>

          {/* Treasury Card */}
          <Paper
            elevation={3}
            sx={{
              marginTop: 3,
              padding: 3,
              borderRadius: 4,
              backgroundColor: '#ffffff',
              border: '2px solid #e0e0e0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWalletIcon sx={{ color: '#333', fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.9rem',
                    color: '#333',
                    animation: treasuryLoading ? 'blink 1.5s ease-in-out infinite' : 'none',
                    '@keyframes blink': {
                      '0%, 100%': {
                        opacity: 1,
                      },
                      '50%': {
                        opacity: 0.5,
                      },
                    },
                  }}
                >
                  {treasuryLoading ? 'FETCHING TREASURY' : 'TREASURY'}
                </Typography>
              </Box>
              <Tooltip title="Copy Treasury Address" arrow>
                <IconButton
                  onClick={handleCopyAddress}
                  sx={{
                    color: '#333',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Grid container spacing={2}>
              {treasuryLoading ? (
                <>
                  {['ETH', 'cbBTC', 'EURC', 'USDC'].map((symbol, index) => {
                    const colors = ['#627eea', '#f7931a', '#003399', '#2775ca'];
                    return (
                      <Grid item xs={12} sm={6} md={3} key={symbol}>
                        <Paper
                          sx={{
                            padding: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: `2px solid ${colors[index]}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, ${colors[index]}22, transparent)`,
                              animation: 'shimmer 2s infinite',
                            },
                            '@keyframes shimmer': {
                              '0%': {
                                left: '-100%',
                              },
                              '100%': {
                                left: '100%',
                              },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              height: 24,
                              width: '60%',
                              backgroundColor: `${colors[index]}33`,
                              borderRadius: 1,
                              marginBottom: 1,
                              animation: 'pulse 1.5s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%, 100%': {
                                  opacity: 0.6,
                                },
                                '50%': {
                                  opacity: 0.3,
                                },
                              },
                            }}
                          />
                          <Box
                            sx={{
                              height: 32,
                              width: '80%',
                              backgroundColor: `${colors[index]}22`,
                              borderRadius: 1,
                              animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                            }}
                          />
                        </Paper>
                      </Grid>
                    );
                  })}
                </>
              ) : (
                <>
                  {treasuryBalances && (
                    <>
                      {/* ETH */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper
                          sx={{
                            padding: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #627eea',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.6rem',
                              color: '#627eea',
                            }}
                          >
                            ETH
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.8rem',
                              marginTop: 1,
                              color: '#333',
                            }}
                          >
                            {treasuryBalances.ETH.balance}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* cbBTC (Coinbase Wrapped BTC) */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper
                          sx={{
                            padding: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #f7931a',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.6rem',
                              color: '#f7931a',
                            }}
                          >
                            {treasuryBalances.WBTC.symbol}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.8rem',
                              marginTop: 1,
                              color: '#333',
                            }}
                          >
                            {treasuryBalances.WBTC.balance}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* EURC */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper
                          sx={{
                            padding: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #003399',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.6rem',
                              color: '#003399',
                            }}
                          >
                            EURC
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.8rem',
                              marginTop: 1,
                              color: '#333',
                            }}
                          >
                            {treasuryBalances.EURC.balance}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* USDC */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper
                          sx={{
                            padding: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #2775ca',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.6rem',
                              color: '#2775ca',
                            }}
                          >
                            USDC
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Press Start 2P", sans-serif',
                              fontSize: '0.8rem',
                              marginTop: 1,
                              color: '#333',
                            }}
                          >
                            {treasuryBalances.USDC.balance}
                          </Typography>
                        </Paper>
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Grid>
          </Paper>

          {/* Proposal Types Legend */}
          <Paper
            elevation={3}
            sx={{
              marginTop: 3,
              padding: 3,
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.9rem',
                marginBottom: 2,
              }}
            >
              PROPOSAL TYPES
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: PROPOSAL_COLORS.ApproveMember.bg,
                    border: `2px solid ${PROPOSAL_COLORS.ApproveMember.border}`,
                    borderRadius: 1,
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                      color: PROPOSAL_COLORS.ApproveMember.text,
                    }}
                  >
                    APPROVE MEMBER (2 votes needed)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: PROPOSAL_COLORS.BanMember.bg,
                    border: `2px solid ${PROPOSAL_COLORS.BanMember.border}`,
                    borderRadius: 1,
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                      color: PROPOSAL_COLORS.BanMember.text,
                    }}
                  >
                    BAN MEMBER (3 votes needed)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: PROPOSAL_COLORS.ExecuteTransactions.bg,
                    border: `2px solid ${PROPOSAL_COLORS.ExecuteTransactions.border}`,
                    borderRadius: 1,
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                      color: PROPOSAL_COLORS.ExecuteTransactions.text,
                    }}
                  >
                    EXECUTE CUSTOM TRANSACTION (4 votes needed)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Vote Confirmation Dialog */}
      <Dialog
        open={voteDialog.open}
        onClose={() =>
          !voting && setVoteDialog({ open: false, proposalId: null, voteFor: false })
        }
      >
        <DialogTitle
          sx={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.9rem',
          }}
        >
          CONFIRM VOTE
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to vote{' '}
            <strong>{voteDialog.voteFor ? 'FOR' : 'AGAINST'}</strong> this proposal?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setVoteDialog({ open: false, proposalId: null, voteFor: false })
            }
            disabled={voting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVoteConfirm}
            variant="contained"
            disabled={voting}
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.7rem',
            }}
          >
            {voting ? <LoadingSpinner size={24} /> : 'CONFIRM'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Address Snackbar */}
      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Treasury address copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.6rem',
            backgroundColor: '#4caf50',
          },
        }}
      />

      {/* Create Proposal Dialog */}
      <CreateProposalDialog
        open={createProposalDialogOpen}
        onClose={() => setCreateProposalDialogOpen(false)}
        onCreateProposal={handleCreateProposal}
        isTopMember={isTopMember}
      />
    </>
  );
}

