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
} from '@mui/material';
import { LoadingScreen, default as LoadingSpinner } from './LoadingSpinner';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import {
  getLiveProposals,
  getHistoricalProposals,
  type LiveProposal,
} from '../lib/supabase-respect';

interface ProposalsPageProps {
  userAddress: string;
  isTopMember: boolean;
  onVote: (proposalId: number, voteFor: boolean) => Promise<void>;
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
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '1.8rem',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            PROPOSALS
          </Typography>

          {!isTopMember && (
            <Alert severity="info" sx={{ marginBottom: 3 }}>
              Only top 6 members can vote on proposals. Keep earning RESPECT to join the top 6!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ marginBottom: 3 }}>
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
                  <Alert severity="info">No live proposals at the moment</Alert>
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
                  <Alert severity="info">No historical proposals yet</Alert>
                )}
              </Box>
            )}
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
                  <Typography variant="caption">
                    Vote to approve a new member to the Respect Game
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
                  <Typography variant="caption">
                    Vote to ban a member from the Respect Game
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
                    EXECUTE TRANSACTIONS (4 votes needed)
                  </Typography>
                  <Typography variant="caption">
                    Vote to execute custom transactions through the governance
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
    </>
  );
}

