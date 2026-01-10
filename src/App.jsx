import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import StaggeredMenu from './components/StaggeredMenu';
import PalmTrees from './components/PalmTrees';
import Shuffle from './components/Shuffle';
import { useSmartWallet } from './hooks/useSmartWallet';
import MobileWarning from './components/MobileWarning';

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
      label: 'TELEGRAM', 
      ariaLabel: 'Join Telegram community', 
      link: 'https://t.me/daooftheapes',
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
      <MobileWarning />
      <div className={isMenuOpen ? 'blurred' : ''}>
        <PalmTrees count={28} />
      </div>
      <div
        className={`w-screen min-h-screen flex flex-col items-center text-center ${
          isMenuOpen ? 'blurred' : ''
        }`}
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'transparent',
          paddingTop: 'clamp(4rem, 12vw, 10rem)',
          paddingBottom: '4rem',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        <Outlet />
      </div>
      {!isHomePage && (
        <>
          {user && (
            <button
              onClick={handleLogout}
              className="logout-btn-header"
              style={{
                position: 'fixed',
                top: '1em',
                right: 'calc(1em + 60px)',
                zIndex: 9999,
                pointerEvents: showHeader ? 'auto' : 'none',
                background: 'transparent',
                color: '#1a1a1a',
                border: 'none',
                padding: 0,
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: 'clamp(0.5rem, 1.5vw, 0.9rem)',
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
              top: '1em',
              left: '1em',
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
                fontSize: 'clamp(0.55rem, 2vw, 1rem)',
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
          colors={['#86EFAC', '#22C55E']}
          logoUrl={null}
          accentColor="#22C55E"
          onMenuOpen={() => setIsMenuOpen(true)}
          onMenuClose={() => setIsMenuOpen(false)}
        />
      </div>
    </>
  );
}

export default App;
