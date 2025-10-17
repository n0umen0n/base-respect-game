import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import StaggeredMenu from './components/StaggeredMenu';
import PixelBlast from './components/PixelBlast';

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

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout, user } = usePrivy();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHomePage = location.pathname === '/';
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
        <Outlet />
      </div>
      {!isHomePage && user && (
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            top: '2rem',
            left: '2rem',
            zIndex: 9999,
            pointerEvents: 'auto',
            background: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.5rem',
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a1a1a';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          LOGOUT
        </button>
      )}
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
