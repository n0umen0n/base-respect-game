import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  Chip,
  Modal,
  Fade,
} from '@mui/material';
import LoadingSpinner from './LoadingSpinner';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';

interface ContributionSubmissionProps {
  gameNumber: number;
  nextStageTimestamp: Date;
  onNavigate: () => void;
}

interface ContributionItem {
  id: number;
  contribution: string;
  link: string;
}

export default function ContributionSubmission({
  gameNumber,
  nextStageTimestamp,
  onNavigate,
}: ContributionSubmissionProps) {
  const [items, setItems] = useState<ContributionItem[]>([
    { id: 1, contribution: '', link: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Get smart wallet and blockchain functions
  const { smartAccountClient, smartAccountAddress } = useSmartWallet();
  const { submitContribution: submitContributionToBlockchain } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
    minimalMode: true,
  });

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(nextStageTimestamp).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Stage ended');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextStageTimestamp]);

  const addContribution = () => {
    const newId = Math.max(...items.map((item) => item.id)) + 1;
    setItems([...items, { id: newId, contribution: '', link: '' }]);
  };

  const removeContribution = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateContribution = (id: number, field: 'contribution' | 'link', value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!smartAccountClient || !smartAccountAddress) {
      setError('Wallet not connected. Please refresh the page.');
      return;
    }

    // Validation - only contribution text is required, links are optional
    const validItems = items.filter(
      (item) => item.contribution.trim()
    );

    if (validItems.length === 0) {
      setError('Please add at least one contribution');
      return;
    }

    try {
      setIsSubmitting(true);

      const contributions = validItems.map((item) => item.contribution.trim());
      const links = validItems.map((item) => item.link.trim() || '');

      console.log('🎯 Submitting contribution to blockchain:', { contributions, links });
      
      // Submit to blockchain
      await submitContributionToBlockchain(contributions, links);

      console.log('✅ Contribution submitted successfully!');
      // Show success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error submitting contribution:', err);
      setError(err.message || 'Failed to submit contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateWithOrdinal = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} of ${month} ${year}`;
  };

  const handleAddToCalendar = () => {
    const rankingPhaseStart = new Date(nextStageTimestamp);
    // Assume ranking phase is ~24 hours, set reminder to middle (12 hours in)
    const midPhaseTime = new Date(rankingPhaseStart.getTime() + 12 * 60 * 60 * 1000);
    const endDate = new Date(midPhaseTime.getTime() + 60 * 60 * 1000); // 1 hour event duration

    const title = encodeURIComponent('Respect Game - Ranking Phase');
    const details = encodeURIComponent('Submit your rankings for the Respect Game');
    const location = encodeURIComponent('https://respectgame.xyz');

    const startDateStr = midPhaseTime.toISOString().replace(/-|:|\.\d+/g, '');
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;

    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          marginTop: '-100px',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 800,
            width: '100%',
            borderRadius: 4,
          }}
        >
          <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1.5rem',
                marginBottom: 2,
              }}
            >
              SUBMIT CONTRIBUTIONS
            </Typography>

            <Chip
              label={`GAME #${gameNumber}`}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                backgroundColor: '#000',
                color: '#fff',
                marginBottom: 2,
              }}
            />

            <Box
              sx={{
                padding: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                marginTop: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  marginBottom: 1,
                }}
              >
                TIME LEFT UNTIL RANKING STAGE
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '1rem',
                  color: '#0052FF',
                  fontWeight: 'bold',
                }}
              >
                {timeLeft}
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                marginBottom: 3,
                lineHeight: 1.8,
              }}
            >
              Please share how you have contributed to the Base community in the past week.
              <br />
              <br />
              You can add links as proof of work.
            </Typography>

            {items.map((item, index) => (
              <Box
                key={item.id}
                sx={{
                  marginBottom: 3,
                  padding: 2,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.7rem',
                    }}
                  >
                    CONTRIBUTION #{index + 1}
                  </Typography>
                  {items.length > 1 && (
                    <IconButton
                      onClick={() => removeContribution(item.id)}
                      size="small"
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <TextField
                  label="Contribution"
                  fullWidth
                  multiline
                  rows={3}
                  value={item.contribution}
                  onChange={(e) =>
                    updateContribution(item.id, 'contribution', e.target.value)
                  }
                  sx={{ 
                    marginBottom: 2,
                    '& .MuiInputBase-input::placeholder': {
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      opacity: 0.6,
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Contribution description"
                />

                <TextField
                  label="Link"
                  fullWidth
                  value={item.link}
                  onChange={(e) => updateContribution(item.id, 'link', e.target.value)}
                  disabled={isSubmitting}
                  placeholder="https://..."
                  helperText="Link to your contribution (GitHub, Twitter, etc.)"
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.6rem',
                      opacity: 0.6,
                    }
                  }}
                />
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addContribution}
              disabled={isSubmitting}
              sx={{
                marginBottom: 3,
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
              }}
            >
              ADD ANOTHER CONTRIBUTION
            </Button>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.875rem',
                padding: '1rem',
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LoadingSpinner size={24} color="#ffffff" />
                  <span>SUBMITTING...</span>
                </Box>
              ) : (
                'SUBMIT CONTRIBUTIONS'
              )}
            </Button>
          </form>
        </Paper>
      </Box>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onNavigate();
        }}
        closeAfterTransition
      >
        <Fade in={showSuccessModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: 24,
              p: 4,
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: 'success.main',
                marginBottom: 2,
              }}
            />
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1.2rem',
                marginBottom: 2,
              }}
            >
              THANK YOU!
            </Typography>
            <Box
              sx={{
                padding: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                marginBottom: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.65rem',
                  marginBottom: 1,
                }}
              >
                PLEASE COME BACK FOR THE RANKING STAGE ON:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '0.85rem',
                  marginBottom: 2,
                }}
              >
                {formatDateWithOrdinal(new Date(nextStageTimestamp))}
              </Typography>
              <Button
                startIcon={<CalendarTodayIcon />}
                onClick={handleAddToCalendar}
                variant="outlined"
                size="small"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.6rem',
                }}
              >
                ADD TO CALENDAR
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                setShowSuccessModal(false);
                onNavigate();
              }}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.875rem',
                padding: '0.75rem 2rem',
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              CONTINUE
            </Button>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

