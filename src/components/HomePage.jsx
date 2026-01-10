import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './Shuffle';
import ProfileCard from './ProfileCard';
import GorillaAnimation from './GorillaAnimation';
import { getTopSixMembers, getAllMembers } from '../lib/supabase-respect';
import { formatRespectDisplay } from '../lib/formatTokens';
import defaultApe from '../assets/default-ape.svg';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Link,
  TextField,
  InputAdornment,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import LoadingSpinner, { LoadingScreen } from './LoadingSpinner';

const HomePage = () => {
  const { login, logout, user, ready, authenticated } = usePrivy();
  const navigate = useNavigate();
  const [topMembers, setTopMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    loadTopMembers();
  }, []);

  // Navigate to /game after login - using sessionStorage to persist across re-renders
  useEffect(() => {
    const shouldNavigateToGame = sessionStorage.getItem('navigateToGameAfterLogin');
    console.log('Navigation effect:', { 
      shouldNavigateToGame, 
      ready, 
      authenticated, 
      user: !!user 
    });
    
    if (shouldNavigateToGame === 'true' && ready && authenticated && user) {
      console.log('✅ NAVIGATING TO /game NOW');
      sessionStorage.removeItem('navigateToGameAfterLogin');
      setIsNavigating(true);
      // Wait for Privy modal to fully close before navigation (prevents flicker)
      setTimeout(() => {
        navigate('/game');
      }, 500);
    }
  }, [ready, authenticated, user, navigate]);

  const loadTopMembers = async () => {
    try {
      const [topSix, all] = await Promise.all([
        getTopSixMembers(),
        getAllMembers()
      ]);
      setTopMembers(topSix);
      setAllMembers(all);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (user) {
      navigate('/game');
    } else {
      console.log('🔑 Login button clicked - setting flag to navigate after login');
      sessionStorage.setItem('navigateToGameAfterLogin', 'true');
      login();
    }
  };

  // Filter members based on search query (from rank 7 onwards)
  const filteredMembers = allMembers.slice(6).filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading spinner if Privy is not ready OR if navigating to game
  // Use LoadingScreen for consistent positioning across the app
  if (!ready || isNavigating) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <Shuffle
        text="DAO OF THE APES"
        tag="div"
        style={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: 'clamp(0.9rem, 5vw, 3.5rem)',
          lineHeight: 1.3,
          color: 'black',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
          maxWidth: '100%',
          wordBreak: 'break-word'
        }}
        shuffleDirection="right"
        duration={0.35}
        animationMode="evenodd"
        shuffleTimes={1}
        ease="power3.out"
        stagger={0.03}
        threshold={0.1}
        triggerOnce={true}
        triggerOnHover={true}
        respectReducedMotion={true}
      />
      
      <AnimatedContent
        distance={80}
        direction="vertical"
        reverse={false}
        duration={0.8}
        ease="power2.out"
        initialOpacity={0}
        animateOpacity
        threshold={0.2}
        delay={0.15}
      >
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 2rem',
          textAlign: 'center',
          padding: '0 1rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <p style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: 'clamp(0.7rem, 2.5vw, 1.5rem)',
            lineHeight: 1.8,
            color: '#333',
            marginBottom: '3.5rem',
            padding: '0 0.5rem',
            wordBreak: 'break-word'
          }}>
            Play Respect Game to PUMP $RESOURCE price
          </p>
          <div style={{ marginBottom: '3rem' }}>
            <Button
              variant="contained"
              onClick={handleButtonClick}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: { xs: '0.7rem', sm: '1rem' },
                textTransform: 'uppercase',
                backgroundColor: 'black',
                color: 'white',
                borderRadius: '9999px',
                padding: { xs: '0.75rem 1.5rem', sm: '1rem 2rem' },
                '&:hover': {
                  backgroundColor: '#333'
                }
              }}
            >
              Enter Jungle
            </Button>
          </div>
        </div>
      </AnimatedContent>

      <div style={{ marginTop: '6rem' }}>
        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="bounce.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.2}
          delay={0.4}
        >
          <h2
            style={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: 'clamp(0.75rem, 3.5vw, 2rem)',
              color: '#000000',
              textAlign: 'center',
              margin: '2rem 0 1rem 0',
              padding: '0 0.5rem',
              wordBreak: 'break-word'
            }}
          >
            APE LEADERBOARD
          </h2>
          <p style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: 'clamp(0.45rem, 1.8vw, 0.85rem)',
            lineHeight: 1.8,
            color: '#000',
            padding: '0.75rem 0.75rem',
            backgroundColor: '#f5f5f5',
            border: '3px solid #000',
            display: 'inline-block',
            margin: '0 0.5rem',
            maxWidth: 'calc(100% - 1rem)',
            boxSizing: 'border-box',
            wordBreak: 'break-word'
          }}>
            10% of $RESOURCEs controlled by top 6 Alpha Apes
          </p>
        </AnimatedContent>
        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="bounce.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.1}
          delay={0.5}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              width: '100%',
              maxWidth: '850px',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}
            className="profile-cards-grid"
          >
            {loading ? (
              <div style={{ paddingTop: '2rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                <LoadingSpinner size={60} />
              </div>
            ) : topMembers.length > 0 ? (
              topMembers.map((member, index) => (
                <ProfileCard
                  key={member.wallet_address}
                  rank={member.rank}
                  name={member.name}
                  x={member.x_account || ''}
                  score={member.average_respect}
                  profileUrl={member.profile_url}
                  xVerified={member.x_verified || false}
                  walletAddress={member.wallet_address}
                />
              ))
            ) : (
              <p style={{ fontFamily: '"Press Start 2P", sans-serif', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                No apes yet. Be the first to join!
              </p>
            )}
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="bounce.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.1}
          delay={0.6}
        >
          <Box
            sx={{
              maxWidth: '1200px',
              margin: '0.5rem auto 0.75rem',
              padding: { xs: '0 0.5rem', sm: '0 2rem' },
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <TextField
              fullWidth
              placeholder="Search by ape name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#000', fontSize: { xs: 18, sm: 24 } }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: { xs: '0.5rem', sm: '0.75rem' },
                  backgroundColor: '#ffffff',
                  border: { xs: '2px solid #000', sm: '4px solid #000' },
                  borderRadius: '8px',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#f0f0f0',
                    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)',
                  },
                },
                '& .MuiInputBase-input': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: { xs: '0.5rem', sm: '0.75rem' },
                  padding: { xs: '0.6rem 0.5rem', sm: '1rem 1rem' },
                  '&::placeholder': {
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: { xs: '0.45rem', sm: '0.7rem' },
                    opacity: 0.6,
                  },
                },
              }}
            />
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              maxWidth: '1200px',
              margin: { xs: '0 0.5rem 2rem', sm: '0 auto 2rem' },
              width: { xs: 'calc(100% - 1rem)', sm: 'auto' },
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: { xs: '2px solid #000', sm: '4px solid #000' },
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <Table
              aria-label="leaderboard table"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                minWidth: { xs: 320, sm: 'auto' }
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#000',
                    '& th': {
                      borderBottom: { xs: '2px solid #000', sm: '4px solid #000' }
                    }
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.5rem', sm: '0.8rem' },
                      color: '#fff',
                      py: { xs: 1.5, sm: 2.5 },
                      px: { xs: 1, sm: 2 },
                      borderRight: '2px solid #333',
                      minWidth: { xs: '40px', sm: 'auto' }
                    }}
                  >
                    Rank
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.5rem', sm: '0.8rem' },
                      color: '#fff',
                      py: { xs: 1.5, sm: 2.5 },
                      paddingLeft: { xs: '1rem', sm: '3rem' },
                      borderRight: '2px solid #333'
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.5rem', sm: '0.8rem' },
                      color: '#fff',
                      py: { xs: 1.5, sm: 2.5 },
                      px: { xs: 1, sm: 2 },
                      borderRight: '2px solid #333',
                      display: { xs: 'none', md: 'table-cell' }
                    }}
                  >
                    X
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.45rem', sm: '0.8rem' },
                      color: '#fff',
                      py: { xs: 1.5, sm: 2.5 },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    SCORE
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <LoadingSpinner size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={4} 
                      align="center"
                      sx={{ 
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.8rem',
                        py: 4
                      }}
                    >
                      {searchQuery ? 'No apes found matching your search' : 'No additional apes yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow
                      key={member.wallet_address}
                      onClick={() => navigate(`/profile/${member.wallet_address}`)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#f0f0f0',
                          transform: { xs: 'none', sm: 'scale(1.01)' }
                        },
                        '&:nth-of-type(odd)': {
                          backgroundColor: '#fafafa'
                        },
                        '& td': {
                          borderRight: '2px solid #e0e0e0',
                          borderBottom: '2px solid #e0e0e0'
                        },
                        '& td:last-child': {
                          borderRight: 'none'
                        }
                      }}
                    >
                      <TableCell 
                        align="center"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: { xs: '0.6rem', sm: '0.9rem' },
                          fontWeight: 'bold',
                          py: { xs: 1.5, sm: 2.5 },
                          px: { xs: 1, sm: 2 },
                          color: '#000'
                        }}
                      >
                        {member.rank}
                      </TableCell>
                      <TableCell 
                        align="left"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: { xs: '0.5rem', sm: '0.7rem' },
                          py: { xs: 1.5, sm: 2.5 },
                          paddingLeft: { xs: '0.75rem', sm: '3rem' }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                          <Avatar
                            src={member.profile_url || defaultApe}
                            alt={member.name}
                            sx={{
                              width: { xs: 32, sm: 48 },
                              height: { xs: 32, sm: 48 },
                              border: { xs: '2px solid #000', sm: '3px solid #000' },
                              imageRendering: 'pixelated',
                              boxShadow: { xs: '2px 2px 0 rgba(0,0,0,0.1)', sm: '4px 4px 0 rgba(0,0,0,0.1)' },
                              flexShrink: 0
                            }}
                          />
                          <span className="member-name-cell">
                            {member.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.65rem',
                          py: 2.5,
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        {member.x_account ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <Link
                              href={`https://x.com/${member.x_account.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                color: '#1DA1F2',
                                textDecoration: 'none',
                                fontFamily: '"Press Start 2P", sans-serif',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: '#0d8bd9'
                                }
                              }}
                            >
                              {member.x_account}
                            </Link>
                            <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#999' }}>
                            <span>missing</span>
                            <CancelIcon sx={{ fontSize: 18, color: '#f44336' }} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: { xs: '0.6rem', sm: '1.1rem' },
                          fontWeight: 'bold',
                          py: { xs: 1.5, sm: 2.5 },
                          px: { xs: 1, sm: 2 },
                          color: '#000'
                        }}
                      >
                        {formatRespectDisplay(member.average_respect)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AnimatedContent>
      </div>

      {/* Animated gorilla that appears after content loads */}
      <GorillaAnimation show={!loading} delay={1500} />
    </div>
  );
};

export default HomePage;
