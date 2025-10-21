import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './Shuffle';
import ProfileCard from './ProfileCard';
import { getTopSixMembers, getAllMembers } from '../lib/supabase-respect';
import { formatRespectDisplay } from '../lib/formatTokens';

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
        text="RESPECT GAME"
        tag="div"
        style={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: '4rem',
          lineHeight: 1,
          color: 'black',
          marginBottom: 'calc(1.5rem + 15px)'
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
        distance={150}
        direction="vertical"
        reverse={false}
        duration={1.2}
        ease="bounce.out"
        initialOpacity={0.2}
        animateOpacity
        scale={1.1}
        threshold={0.2}
        delay={0.3}
      >
        <div style={{ display: 'inline-block' }}>
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
            {user ? 'PLAY' : 'Log in to play'}
          </Button>
        </div>
      </AnimatedContent>

      <div style={{ marginTop: '4rem' }}>
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
            LEADERBOARD
          </h2>
          <p
            style={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '1rem',
              color: '#000000',
              textAlign: 'center'
            }}
          >
            MOST RESPECTED BASE COMMUNITY MEMBERS
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
              flexWrap: 'wrap',
              gap: '2rem',
              padding: '0 2rem 2rem',
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <div style={{ paddingTop: '2rem' }}>
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
                  style={{ flex: '0 1 340px' }}
                />
              ))
            ) : (
              <p style={{ fontFamily: '"Press Start 2P", sans-serif', fontSize: '0.8rem' }}>
                No members yet. Be the first to join!
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
              margin: '4rem auto 0.75rem',
              padding: '0 2rem'
            }}
          >
            <TextField
              fullWidth
              placeholder="Search members by name..."
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
                      {searchQuery ? 'No members found matching your search' : 'No additional members yet'}
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
                            src={member.profile_url}
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
                            {member.x_verified && (
                              <span title="Verified" style={{ fontSize: '1rem' }}>✅</span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#999' }}>
                            <span>missing</span>
                            <span style={{ fontSize: '1rem' }}>❌</span>
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
    </div>
  );
};

export default HomePage;
