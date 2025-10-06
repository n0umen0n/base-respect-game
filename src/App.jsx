import { useState } from 'react';
import AnimatedContent from './components/AnimatedContent';
import Button from '@mui/material/Button';
import Shuffle from './components/Shuffle';
import StaggeredMenu from './components/StaggeredMenu';
import PixelBlast from './components/PixelBlast';
import ClickSpark from './components/ClickSpark';
import ElectricBorder from './components/ElectricBorder';
import profileImage from './assets/profile.jpg';

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
  { label: 'Services', ariaLabel: 'View our services', link: '/services' },
  { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
];

const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com' },
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' }
];

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ClickSpark sparkColor="#000000">
      <div
        className={isMenuOpen ? 'blurred' : ''}
        style={{
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1
        }}
      >
        <PixelBlast
          variant="square"
          pixelSize={24}
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
        className={`h-screen w-screen flex flex-col items-center justify-start pt-48 text-center ${
          isMenuOpen ? 'blurred' : ''
        }`}
        style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
      >
        <Shuffle
          text="RESPECT GAME"
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
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1rem',
                textTransform: 'uppercase',
                marginTop: '2rem',
                backgroundColor: 'black',
                color: 'white',
                borderRadius: '9999px',
                padding: '1rem 2rem',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              Log in to play
            </Button>
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
          threshold={0.2}
          delay={0.4}
        >
          <h2
            style={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '2rem',
              color: '#000000',
              textAlign: 'center',
              margin: '4rem 0 1rem 0'
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          {['#FFD700', '#C0C0C0', '#CD7F32', '#0000FF', '#0000FF', '#0000FF'].map((color, index) => (
            <AnimatedContent
              key={index}
              distance={150}
              direction="vertical"
              reverse={false}
              duration={1.2}
              ease="bounce.out"
              initialOpacity={0.2}
              animateOpacity
              scale={1.1}
              threshold={0.2}
              delay={0.5 + index * 0.1}
            >
              <ElectricBorder color={color} speed={1} chaos={0.5} thickness={2} style={{ borderRadius: 16 }}>
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 16,
                    textAlign: 'left',
                    fontFamily: '"Press Start 2P", sans-serif'
                  }}
                >
                  <img
                    src={profileImage}
                    alt="Vlad"
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}
                  />
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>Rank: {index + 1}</p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>Name: Vlad</p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>X: @cxvznk</p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>RESPECT SCORE: 12</p>
                </div>
              </ElectricBorder>
            </AnimatedContent>
          ))}
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
        colors={['#B19EEF', '#5227FF']}
        logoUrl={null}
        accentColor="#5227FF"
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
      />
    </ClickSpark>
  );
}

export default App;
