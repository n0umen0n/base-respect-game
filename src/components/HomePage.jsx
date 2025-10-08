import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './Shuffle';
import ProfileCard from './ProfileCard';
import profileImage from '../assets/profile.jpg';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Link
} from '@mui/material';

const leaderboardData = [
    { rank: 1, name: 'Vlad', x: '@cxvznk', score: 12 },
    { rank: 2, name: 'Based', x: '@based', score: 11 },
    { rank: 3, name: 'Chad', x: '@chad', score: 10 },
    { rank: 4, name: 'Anon', x: '@anon', score: 9 },
    { rank: 5, name: 'Mog', x: '@mog', score: 8 },
    { rank: 6, name: 'Looksmaxx', x: '@looksmaxx', score: 7 },
    { rank: 7, name: 'User7', x: '@user7', score: 6 },
    { rank: 8, name: 'User8', x: '@user8', score: 5 },
    { rank: 9, name: 'User9', x: '@user9', score: 4 },
    { rank: 10, name: 'User10', x: '@user10', score: 3 },
    { rank: 11, name: 'User11', x: '@user11', score: 2 },
    { rank: 12, name: 'User12', x: '@user12', score: 1 }
  ];

const HomePage = () => {
  const { login, user, ready } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) {
      navigate('/dashboard');
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
            {leaderboardData.slice(0, 6).map((player, index) => (
              <ProfileCard
                key={index}
                rank={player.rank}
                name={player.name}
                x={player.x}
                score={player.score}
                style={{ flex: '0 1 340px' }}
              />
            ))}
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
                    Profile
                  </TableCell>
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
                {leaderboardData.slice(6).map((row) => (
                  <TableRow
                    key={row.name}
                    onClick={() =>
                      window.open(
                        'https://google.com',
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell component="th" scope="row" align="center">
                      <Avatar
                        alt={row.name}
                        src={profileImage}
                        sx={{ borderRadius: '8px', margin: 'auto' }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'inherit' }}>
                      {row.rank}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'inherit' }}>
                      {row.name}
                    </TableCell>
                    <TableCell align="center">
                      <Link
                        href={`https://x.com/${row.x.substring(1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#1da1f2',
                          textDecoration: 'none',
                          fontFamily: '"Press Start 2P", sans-serif',
                          fontSize: 'inherit',
                          '&:hover': {
                            color: '#00008b'
                          }
                        }}
                      >
                        {row.x}
                      </Link>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'inherit' }}>
                      {row.score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AnimatedContent>
      </div>
    </div>
  );
};

export default HomePage;
