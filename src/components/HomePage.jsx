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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  const handleLogout = async () => {
    sessionStorage.removeItem('navigateToGameAfterLogin');
    await logout();
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
      {user && (
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            top: '2em',
            right: 'calc(2em + 140px)',
            zIndex: 9999,
            pointerEvents: showHeader ? 'auto' : 'none',
            background: 'transparent',
            color: '#1a1a1a',
            border: 'none',
            padding: 0,
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            fontWeight: '500',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            transform: showHeader ? 'translateY(0)' : 'translateY(-150%)',
            opacity: showHeader ? 1 : 0
          }}
          onMouseEnter={(e) => {
            if (showHeader) e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            if (showHeader) e.currentTarget.style.opacity = '1';
          }}
        >
          Logout
        </button>
      )}
      <Shuffle
        text="DAO OF THE APES"
        tag="div"
        style={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: '3.5rem',
          lineHeight: 1,
          color: 'black',
          marginBottom: '1.5rem'
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
          padding: '0 1rem'
        }}>
          <p style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '1.5rem',
            lineHeight: 1.8,
            color: '#333',
            marginBottom: '3.5rem'
          }}>
            Play Respect Game to PUMP $RESOURCE price
          </p>
          <div style={{ marginBottom: '3rem' }}>
            <Button
              variant="contained"
              onClick={handleButtonClick}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1rem',
                textTransform: 'uppercase',
                backgroundColor: 'black',
                color: 'white',
                borderRadius: '9999px',
                padding: '1rem 2rem',
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
              fontSize: '2rem',
              color: '#000000',
              textAlign: 'center',
              margin: '2rem 0 1rem 0'
            }}
          >
            APE LEADERBOARD
          </h2>
          <p style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#000',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f5f5f5',
            border: '3px solid #000',
            display: 'inline-block'
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
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 380px)',
              gap: '2rem',
              padding: '2rem',
              width: 'fit-content',
              margin: '0 auto'
            }}
          >
            {loading ? (
              <div style={{ paddingTop: '2rem', gridColumn: 'span 2', textAlign: 'center' }}>
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
              <p style={{ fontFamily: '"Press Start 2P", sans-serif', fontSize: '0.8rem', gridColumn: 'span 2' }}>
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
              padding: '0 2rem'
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
                    <SearchIcon sx={{ color: '#000' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.75rem',
                  backgroundColor: '#ffffff',
                  border: '4px solid #000',
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
                  fontSize: '0.75rem',
                  padding: '1rem 1rem',
                  '&::placeholder': {
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.7rem',
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
              margin: '0 auto 2rem',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '4px solid #000',
              overflow: 'hidden'
            }}
          >
            <Table
              aria-label="leaderboard table"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif'
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#000',
                    '& th': {
                      borderBottom: '4px solid #000'
                    }
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      color: '#fff',
                      py: 2.5,
                      borderRight: '2px solid #333'
                    }}
                  >
                    Rank
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      color: '#fff',
                      py: 2.5,
                      paddingLeft: '3rem',
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
                      fontSize: '0.8rem',
                      color: '#fff',
                      py: 2.5,
                      borderRight: '2px solid #333'
                    }}
                  >
                    X
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ 
                      fontFamily: '"Press Start 2P", sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      color: '#fff',
                      py: 2.5
                    }}
                  >
                    RESPECT SCORE
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
                          transform: 'scale(1.01)'
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
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          py: 2.5,
                          color: '#000'
                        }}
                      >
                        {member.rank}
                      </TableCell>
                      <TableCell 
                        align="left"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.7rem',
                          py: 2.5,
                          paddingLeft: '3rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start' }}>
                          <Avatar
                            src={member.profile_url || defaultApe}
                            alt={member.name}
                            sx={{
                              width: 48,
                              height: 48,
                              border: '3px solid #000',
                              imageRendering: 'pixelated',
                              boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
                            }}
                          />
                          <span style={{ 
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {member.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ 
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: '0.65rem',
                          py: 2.5
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
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          py: 2.5,
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
