import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './Shuffle';
import ProfileCard from './ProfileCard';
import { getTopSixMembers } from '../lib/supabase-respect';

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
  CircularProgress
} from '@mui/material';

const HomePage = () => {
  const { login, user, ready } = usePrivy();
  const navigate = useNavigate();
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopMembers();
  }, []);

  const loadTopMembers = async () => {
    try {
      const members = await getTopSixMembers();
      setTopMembers(members);
    } catch (error) {
      console.error('Error loading top members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && user) {
      navigate('/game');
    }
  }, [ready, user, navigate]);

  if (!ready || user) {
    return null;
  }

  return (
    <div>
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
            onClick={login}
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
            Log in to play
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
              <CircularProgress />
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
          <TableContainer
            component={Paper}
            sx={{
              maxWidth: '800px',
              margin: '4rem auto 0',
              background: '#f5f5f5',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Table
              aria-label="leaderboard table"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif'
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    Rank
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    X
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    RESPECT SCORE
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && topMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No members yet
                    </TableCell>
                  </TableRow>
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
