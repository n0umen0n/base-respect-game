import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import StaggeredMenu from './components/StaggeredMenu';
import PixelBlast from './components/PixelBlast';
import Shuffle from './components/Shuffle';
import { useSmartWallet } from './hooks/useSmartWallet';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { logout, user } = usePrivy();
  const { smartAccountAddress } = useSmartWallet();
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = useMemo(() => {
    const items = [];
    
    // Add "My Profile" only if user is logged in
    if (user && smartAccountAddress) {
      items.push({ 
        label: 'My Profile', 
        ariaLabel: 'Go to my profile', 
        link: `/profile/${smartAccountAddress}` 
      });
    }
    
    // Add Proposals
    items.push({ 
      label: 'Proposals', 
      ariaLabel: 'View proposals', 
      link: '/proposals' 
    });
    
    // Add external links (marked as secondary for different styling)
    items.push({ 
      label: 'ORGANIZATION', 
      ariaLabel: 'Visit Hypha organization', 
      link: 'https://app.hypha.earth/en/dho/respect-game-ceo/overview',
      secondary: true
    });
    
    items.push({ 
      label: 'GITHUB', 
      ariaLabel: 'View GitHub repository', 
      link: 'https://github.com/n0umen0n/base-respect-game',
      secondary: true
    });
    
    items.push({ 
      label: 'CRYPTO SWAG', 
      ariaLabel: 'Get crypto swag', 
      link: 'https://moodcyi.com/',
      secondary: true
    });
    
    items.push({ 
      label: 'TELEGRAM', 
      ariaLabel: 'Join Telegram community', 
      link: 'https://t.me/respectgameofficial',
      secondary: true
    });
    
    return items;
  }, [user, smartAccountAddress]);
  
  const isHomePage = location.pathname === '/';
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        // Always show at the top
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setShowHeader(false);
      } else {
        // Scrolling up - show header
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
      {!isHomePage && (
        <>
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
          <div
            onClick={() => navigate('/')}
            style={{
              position: 'fixed',
              top: '2em',
              left: '2em',
              zIndex: 50,
              pointerEvents: showHeader ? 'auto' : 'none',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              transform: showHeader ? 'translateY(0)' : 'translateY(-150%)',
              opacity: showHeader ? 1 : 0
            }}
          >
            <Shuffle
              text="RESPECT GAME"
              tag="div"
              style={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1rem',
                lineHeight: 1,
                color: '#1a1a1a'
              }}
              shuffleDirection="right"
              duration={0.35}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power3.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={false}
              triggerOnHover={true}
              respectReducedMotion={true}
            />
          </div>
        </>
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 40,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: showHeader ? 'translateY(0)' : 'translateY(-150%)',
          opacity: showHeader ? 1 : 0,
          pointerEvents: isMenuOpen ? 'auto' : 'none'
        }}
      >
        <StaggeredMenu
          position="right"
          isFixed={false}
          items={menuItems}
          socialItems={[]}
          displaySocials={false}
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
      </div>
    </>
  );
}

export default App;
