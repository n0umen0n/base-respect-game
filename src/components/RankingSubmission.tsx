import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
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
  onSubmitRanking: (rankedAddresses: string[]) => Promise<void>;
  onNavigate: () => void;
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
      sx={{
        marginBottom: 2,
        cursor: 'grab',
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#fafafa',
        border: '2px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          border: '2px solid #bdbdbd',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <CardContent sx={{ padding: '20px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '170px 1fr 150px', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DragIndicatorIcon sx={{ color: '#757575', cursor: 'grab', fontSize: 28 }} />
            
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', justifyContent: 'center' }} {...attributes} {...listeners}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1rem',
                color: '#000',
                lineHeight: 1.4,
              }}
            >
              {member.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
              {member.xAccount ? (
                <>
                  <XIcon sx={{ fontSize: 16, color: '#000' }} />
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
                      color: '#000',
                    }}
                  >
                    :
                  </Typography>
                  <Link
                    href={`https://x.com/${member.xAccount.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
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
                    {member.xAccount}
                  </Link>
                  <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                </>
              ) : (
                <>
                  <XIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />
                  <Typography
                    sx={{
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontSize: '0.65rem',
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
          <Box sx={{ marginTop: 2, paddingTop: 2, borderTop: '2px solid #e0e0e0', backgroundColor: '#f9f9f9', padding: 2, borderRadius: 2 }}>
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
                <Box key={index} sx={{ marginBottom: 2, padding: 1.5, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography
                    variant="body2"
                    sx={{ 
                      marginBottom: 1, 
                      fontSize: '0.75rem',
                      lineHeight: 1.6,
                      color: '#333',
                    }}
                  >
                    {contribution}
                  </Typography>
                  {member.links[index] && (
                    <Link
                      href={member.links[index]}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.6rem',
                        wordBreak: 'break-all',
                        color: '#1da1f2',
                        textDecoration: 'none',
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
  onSubmitRanking,
  onNavigate,
}: RankingSubmissionProps) {
  const [members, setMembers] = useState(groupMembers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync members state when groupMembers prop changes
  useEffect(() => {
    setMembers(groupMembers);
  }, [groupMembers]);

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

    try {
      setIsSubmitting(true);

      const rankedAddresses = members.map((member) => member.address);
      await onSubmitRanking(rankedAddresses);

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error submitting ranking:', err);
      setError(err.message || 'Failed to submit ranking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 50px',
          marginTop: '-200px',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 'none',
            minWidth: '1200px',
            borderRadius: 4,
            position: 'relative',
            zIndex: 1,
            '@media (max-width: 1300px)': {
              minWidth: 'auto',
              width: 'calc(100vw - 100px)',
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
                <CircularProgress size={24} sx={{ color: 'white' }} />
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
                marginBottom: 2,
              }}
            >
              THANK YOU!
            </Typography>
            <Typography
              sx={{
                marginBottom: 2,
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              Your rankings have been submitted successfully.
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
                  marginBottom: 1,
                }}
              >
                CHECK RESULTS IN YOUR PROFILE
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                }}
              >
                Results will be available after all rankings are processed
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
                  marginBottom: 1,
                }}
              >
                NEXT GAME SUBMISSIONS START
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '0.85rem',
                  marginBottom: 2,
                }}
              >
                {new Date(nextSubmissionStageDate).toLocaleString()}
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

