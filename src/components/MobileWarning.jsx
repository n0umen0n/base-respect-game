import { useState, useEffect } from 'react';

function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is mobile size or if it's a touch device
      const mobileWidth = window.innerWidth <= 1024;
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobileWidth || touchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div
        style={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: '1.5rem',
          lineHeight: '2.5rem',
          color: '#0052FF',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0, 82, 255, 0.5)',
          animation: 'blink 1.5s infinite',
          maxWidth: '90%'
        }}
      >
        ALPHA VERSION OF THE APP DESKTOP ONLY
      </div>
      <style>
        {`
          @keyframes blink {
            0%, 49% {
              opacity: 1;
            }
            50%, 100% {
              opacity: 0.4;
            }
          }
        `}
      </style>
    </div>
  );
}

export default MobileWarning;

