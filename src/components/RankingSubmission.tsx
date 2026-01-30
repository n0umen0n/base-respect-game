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
  TouchSensor,
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
// @ts-ignore - image import
import defaultApe from '../assets/default-ape.png';

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

  // Use CSS.Translate instead of CSS.Transform to prevent scale jump
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none' as const,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{
        marginBottom: 2,
        position: 'relative',
        backgroundColor: isDragging ? '#fff' : '#fafafa',
        border: isDragging ? '2px solid #22C55E' : '2px solid #e0e0e0',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
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
      <CardContent sx={{ padding: { xs: '12px !important', sm: '16px !important', md: '20px !important' }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: '100%', maxWidth: '100%', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          <Box {...listeners} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 2 }, cursor: 'grab', '&:active': { cursor: 'grabbing' }, flexShrink: 0, touchAction: 'none' }}>
            <DragIndicatorIcon sx={{ color: '#757575', fontSize: { xs: 20, sm: 24, md: 28 } }} />
            
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.7rem', sm: '0.9rem', md: '1.1rem' },
                color: '#000',
              }}
            >
              #{rank}
            </Typography>

            <Avatar
              src={member.profileUrl || defaultApe}
              alt={member.name}
              sx={{
                width: { xs: 36, sm: 48, md: 60 },
                height: { xs: 36, sm: 48, md: 60 },
                borderRadius: { xs: 1, md: 2 },
                border: '2px solid #e0e0e0',
              }}
            />
          </Box>

          <Box {...listeners} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'center', cursor: 'grab', '&:active': { cursor: 'grabbing' }, minWidth: 0, overflow: 'hidden', flex: 1, touchAction: 'none' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
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
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75, justifyContent: 'center', maxWidth: '100%', overflow: 'hidden' }}>
              {member.xAccount ? (
                <>
                  <XIcon sx={{ fontSize: 14, color: '#000', flexShrink: 0 }} />
                  <Link
                    href={`https://x.com/${member.xAccount.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.65rem' },
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
                  <VerifiedIcon sx={{ fontSize: 16, color: '#4CAF50', flexShrink: 0 }} />
                </>
              ) : (
                <>
                  <XIcon sx={{ fontSize: 14, color: '#9e9e9e', flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: { xs: '0.5rem', sm: '0.55rem' },
                      color: '#9e9e9e',
                      flexShrink: 0,
                    }}
                  >
                    missing
                  </Typography>
                  <CancelIcon sx={{ fontSize: 16, color: '#f44336', flexShrink: 0 }} />
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              size="small"
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
                <Box key={index} sx={{ marginBottom: 2, padding: 1.5, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', maxHeight: { xs: '200px', sm: '250px', md: '300px' }, overflowY: 'auto' }}>
                  <Typography
                    variant="body2"
                    sx={{ 
                      marginBottom: 1, 
                      fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                      lineHeight: 1.6,
                      color: '#333',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
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

  // Use both pointer and touch sensors for best cross-device support
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // Desktop: small movement required
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50, // Very short delay - feels instant
      tolerance: 8, // Allow small movement during delay
    },
  });
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  
  const sensors = useSensors(touchSensor, pointerSensor, keyboardSensor); // Touch first for mobile priority

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

  const getTimeUntilNextContribution = () => {
    // nextSubmissionStageDate is already the date when next contribution stage starts
    const now = Date.now();
    const target = new Date(nextSubmissionStageDate).getTime();
    const difference = target - now;

    // If time is in the past, return 0 minutes
    if (difference <= 0) {
      return {
        text: '0 MINUTES',
        lessThan24Hours: true,
        isPast: true
      };
    }

    const totalHours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return {
        text: `${days} ${days === 1 ? 'DAY' : 'DAYS'} ${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} ${minutes} ${minutes === 1 ? 'MINUTE' : 'MINUTES'}`,
        lessThan24Hours: false,
        isPast: false
      };
    } else if (hours > 0) {
      return {
        text: `${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} ${minutes} ${minutes === 1 ? 'MINUTE' : 'MINUTES'}`,
        lessThan24Hours: true,
        isPast: false
      };
    } else {
      return {
        text: `${minutes} ${minutes === 1 ? 'MINUTE' : 'MINUTES'}`,
        lessThan24Hours: true,
        isPast: false
      };
    }
  };

  const handleAddToCalendar = () => {
    // nextSubmissionStageDate is already the date when next contribution stage starts
    const nextContributionDate = new Date(nextSubmissionStageDate);
    const endDate = new Date(nextContributionDate.getTime() + 10 * 60 * 1000); // 10 minute event

    const title = encodeURIComponent('Respect Game - Contribution Submission');
    const details = encodeURIComponent('Submit your contributions for the next Respect Game');
    const location = encodeURIComponent('https://respectgame.app');

    const startDateStr = nextContributionDate.toISOString().replace(/-|:|\.\d+/g, '');
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
          padding: { xs: '0 16px', sm: '0 32px', md: '0 50px' },
          paddingTop: { xs: '40px', md: '80px' },
          paddingBottom: { xs: '40px', md: '80px' },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '1200px',
            borderRadius: { xs: 2, md: 4 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ textAlign: 'center', marginBottom: { xs: 2, md: 4 } }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.5rem' },
                marginBottom: 2,
              }}
            >
              RANK CONTRIBUTIONS
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                marginBottom: 1,
                lineHeight: 1.8,
              }}
            >
              Drag and drop to rank from 1st (best) to last.
            </Typography>
            
            <Box sx={{ height: '0.5rem' }} />
            
            <Typography
              variant="body1"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                marginBottom: { xs: 2, md: 3 },
                lineHeight: 1.8,
              }}
            >
              Tap cards to view contributions.
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
                <span>SUBMITTING</span>
                <LoadingSpinner size={24} color="#ffffff" />
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
              width: { xs: 'calc(100% - 32px)', sm: 500 },
              maxWidth: 500,
              maxHeight: { xs: 'calc(100vh - 32px)', sm: 'auto' },
              bgcolor: 'background.paper',
              borderRadius: { xs: 2, sm: 4 },
              boxShadow: 24,
              p: { xs: 2.5, sm: 4 },
              textAlign: 'center',
              overflowY: 'auto',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: { xs: 60, sm: 80 },
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
                fontSize: { xs: '0.9rem', sm: '1.2rem' },
                marginBottom: 3,
                lineHeight: 1.4,
              }}
            >
              RANKING SUBMITTED!
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
                  marginBottom: 2,
                  lineHeight: 1.8,
                }}
              >
                NEXT GAME STARTS{getTimeUntilNextContribution()?.lessThan24Hours ? ' IN:' : ' ON:'}
              </Typography>
              {getTimeUntilNextContribution()?.lessThan24Hours && (
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.9rem',
                    color: '#000',
                    fontWeight: 'bold',
                    marginBottom: 2,
                  }}
                >
                  {getTimeUntilNextContribution()?.text}
                </Typography>
              )}
              {!getTimeUntilNextContribution()?.lessThan24Hours && (
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.9rem',
                    color: '#000',
                    marginBottom: 2,
                  }}
                >
                  {formatDateWithOrdinal(new Date(nextSubmissionStageDate))}
                </Typography>
              )}
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

