import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Avatar,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Modal,
  Fade,
  Link,
} from '@mui/material';
import LoadingSpinner from './LoadingSpinner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import XIcon from '@mui/icons-material/X';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';

interface Member {
  address: string;
  name: string;
  profileUrl?: string;
  xAccount?: string;
  xVerified: boolean;
  contributions: string[];
  links: string[];
}

interface RankingSubmissionProps {
  gameNumber: number;
  groupMembers: Member[];
  nextSubmissionStageDate: Date;
  onNavigate: () => void;
  onLoadingChange?: (loading: boolean) => void; // Callback to notify parent of loading state
}

function SortableCard({ member, rank }: { member: Member; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.address });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{
        marginBottom: 2,
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#fafafa',
        border: '2px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          border: '2px solid #bdbdbd',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ padding: '20px !important', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '170px 1fr 150px', alignItems: 'center', gap: 2, width: '100%', maxWidth: '100%' }}>
          <Box {...listeners} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
            <DragIndicatorIcon sx={{ color: '#757575', fontSize: 28 }} />
            
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1.1rem',
                color: '#000',
              }}
            >
              #{rank}
            </Typography>

            <Avatar
              src={member.profileUrl}
              alt={member.name}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                border: '2px solid #e0e0e0',
              }}
            />
          </Box>

          <Box {...listeners} sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', justifyContent: 'center', cursor: 'grab', '&:active': { cursor: 'grabbing' }, minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1rem',
                color: '#000',
                lineHeight: 1.4,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {member.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'center', maxWidth: '100%', overflow: 'hidden' }}>
              {member.xAccount ? (
                <>
                  <XIcon sx={{ fontSize: 16, color: '#000', flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#000',
                      flexShrink: 0,
                    }}
                  >
                    :
                  </Typography>
                  <Link
                    href={`https://x.com/${member.xAccount.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#1da1f2',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {member.xAccount}
                  </Link>
                  <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50', flexShrink: 0 }} />
                </>
              ) : (
                <>
                  <XIcon sx={{ fontSize: 16, color: '#9e9e9e', flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#000',
                      flexShrink: 0,
                    }}
                  >
                    :
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#9e9e9e',
                      flexShrink: 0,
                    }}
                  >
                    missing
                  </Typography>
                  <CancelIcon sx={{ fontSize: 18, color: '#f44336', flexShrink: 0 }} />
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.3s',
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                },
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ marginTop: 2, paddingTop: 2, borderTop: '2px solid #e0e0e0', backgroundColor: '#f9f9f9', padding: 2, borderRadius: 2, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                marginBottom: 2,
                color: '#000',
              }}
            >
              CONTRIBUTIONS
            </Typography>
            {member.contributions.length > 0 ? (
              member.contributions.map((contribution, index) => (
                <Box key={index} sx={{ marginBottom: 2, padding: 1.5, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <Typography
                    variant="body2"
                    sx={{ 
                      marginBottom: 1, 
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      color: '#333',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {contribution}
                  </Typography>
                  {member.links[index] && (
                    <Link
                      href={member.links[index]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.6rem',
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        color: '#1da1f2',
                        textDecoration: 'none',
                        display: 'block',
                        maxWidth: '100%',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {member.links[index]}
                    </Link>
                  )}
                </Box>
              ))
            ) : (
              <Typography 
                variant="body2" 
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.65rem',
                  color: '#9e9e9e',
                }}
              >
                No contributions submitted
              </Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function RankingSubmission({
  gameNumber,
  groupMembers,
  nextSubmissionStageDate,
  onNavigate,
  onLoadingChange,
}: RankingSubmissionProps) {
  const [members, setMembers] = useState(groupMembers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);

  // Get smart wallet and blockchain functions
  const { smartAccountClient, smartAccountAddress } = useSmartWallet();
  const { submitRanking: submitRankingToBlockchain } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
    minimalMode: true,
  });

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Component is ready after initial render
  useEffect(() => {
    setLoading(false);
  }, []);

  // Sync members state when groupMembers prop changes
  useEffect(() => {
    setMembers(groupMembers);
  }, [groupMembers]);

  // Countdown timer for results availability
  useEffect(() => {
    const updateCountdown = () => {
      const timeDiff = new Date(nextSubmissionStageDate).getTime() - Date.now();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextSubmissionStageDate]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMembers((items) => {
        const oldIndex = items.findIndex((item) => item.address === active.id);
        const newIndex = items.findIndex((item) => item.address === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!smartAccountClient || !smartAccountAddress) {
      setError('Wallet not connected. Please refresh the page.');
      return;
    }

    try {
      setIsSubmitting(true);

      const rankedAddresses = members.map((member) => member.address);
      console.log('🎯 Submitting ranking to blockchain:', rankedAddresses);
      
      // Submit to blockchain
      await submitRankingToBlockchain(rankedAddresses);

      console.log('✅ Ranking submitted successfully!');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error submitting ranking:', err);
      setError(err.message || 'Failed to submit ranking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateWithOrdinal = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(nextSubmissionStageDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const title = encodeURIComponent('Respect Game - Contribution Submission');
    const details = encodeURIComponent('Submit your contributions for the next Respect Game');
    const location = encodeURIComponent('https://respectgame.xyz');

    const startDateStr = startDate.toISOString().replace(/-|:|\.\d+/g, '');
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 50px',
          paddingTop: '80px',
          paddingBottom: '80px',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '1200px',
            maxWidth: '1200px',
            borderRadius: 4,
            position: 'relative',
            zIndex: 1,
            '@media (max-width: 1300px)': {
              width: 'calc(100vw - 100px)',
              maxWidth: 'calc(100vw - 100px)',
            },
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
              CONTRIBUTION RANKING
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                marginBottom: 1,
                lineHeight: 1.8,
              }}
            >
              Drag and drop to rank members from 1st (best) to last.
            </Typography>
            
            <Box sx={{ height: '1rem' }} />
            
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                marginBottom: 3,
                lineHeight: 1.8,
              }}
            >
              Click cards to view contributions.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={members.map((m) => m.address)}
              strategy={verticalListSortingStrategy}
            >
              {members.map((member, index) => (
                <SortableCard
                  key={member.address}
                  member={member}
                  rank={index + 1}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.875rem',
              padding: '1rem',
              backgroundColor: '#000',
              marginTop: 3,
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
              'SUBMIT RANKING'
            )}
          </Button>
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
                marginBottom: 3,
              }}
            >
              THANK YOU!
            </Typography>
            <Box
              sx={{
                padding: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                marginBottom: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.65rem',
                  marginBottom: 2,
                  lineHeight: 1.8,
                }}
              >
                RESULTS WILL BE AVAILABLE ON YOUR PROFILE PAGE IN:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.9rem',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                {countdown.days > 0 ? (
                  `${countdown.days} ${countdown.days === 1 ? 'DAY' : 'DAYS'} ${countdown.hours} ${countdown.hours === 1 ? 'HOUR' : 'HOURS'}`
                ) : countdown.hours > 0 ? (
                  `${countdown.hours} ${countdown.hours === 1 ? 'HOUR' : 'HOURS'} ${countdown.minutes} ${countdown.minutes === 1 ? 'MINUTE' : 'MINUTES'}`
                ) : (
                  `${countdown.minutes} ${countdown.minutes === 1 ? 'MINUTE' : 'MINUTES'}`
                )}
              </Typography>
            </Box>
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
                  marginBottom: 2,
                  lineHeight: 1.8,
                }}
              >
                SUBMIT YOUR NEXT CONTRIBUTIONS ON:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.9rem',
                  color: '#000',
                  marginBottom: 2,
                }}
              >
                {(() => {
                  // Calculate the last day of next contribution phase (6 days after it starts)
                  const lastSubmissionDay = new Date(nextSubmissionStageDate);
                  lastSubmissionDay.setDate(lastSubmissionDay.getDate() + 6);
                  return formatDateWithOrdinal(lastSubmissionDay);
                })()}
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
              GO TO PROFILE
            </Button>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

