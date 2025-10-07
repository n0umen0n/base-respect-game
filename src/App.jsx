import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AnimatedContent from './components/AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './components/Shuffle';
import StaggeredMenu from './components/StaggeredMenu';
import PixelBlast from './components/PixelBlast';
import profileImage from './assets/profile.jpg';
import ProfileCard from './components/ProfileCard';

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
import CloseIcon from '@mui/icons-material/Close';

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'About', ariaLabel: 'Learn about us', link: 'https://x.com' },
  { label: 'Services', ariaLabel: 'View our services', link: '/services' },
  { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
];

const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com' },
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' }
];

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

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { login, logout, user } = usePrivy();

  return (
    <>
      <div
        className={isMenuOpen ? 'blurred' : ''}
        style={{
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1,
          pointerEvents: 'none'
        }}
      >
        <PixelBlast
          variant="square"
          pixelSize={18}
          color="#F5F5F5"
          patternScale={3}
          patternDensity={0.3}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>
      <div
        className={`w-screen min-h-screen flex flex-col items-center text-center ${
          isMenuOpen ? 'blurred' : ''
        }`}
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'transparent',
          paddingTop: '10rem',
          paddingBottom: '4rem'
        }}
      >
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
              onClick={user ? logout : login}
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
              {user
                ? `Logout ${user.wallet?.address.slice(
                    0,
                    6
                  )}...${user.wallet?.address.slice(-4)}`
                : 'Log in to play'}
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
      <StaggeredMenu
        position="right"
        isFixed={true}
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#1a1a1a"
        openMenuButtonColor="#1a1a1a"
        changeMenuColorOnOpen={true}
        colors={['#80A8FF', '#0052FF']}
        logoUrl={null}
        accentColor="#0052FF"
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export default App;
