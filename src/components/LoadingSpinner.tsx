import { Box, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
`;

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ size = 60, color = '#22C55E' }: LoadingSpinnerProps) {
  const dotSize = size / 5;
  const spacing = size / 4;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: `${spacing}px`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            backgroundColor: color,
            borderRadius: 0,
            animation: `${bounce} 1.4s infinite ease-in-out both`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </Box>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: '100vh',
        paddingTop: { xs: '20vh', sm: '15vh' },
        paddingX: 2,
        gap: { xs: 2, sm: 3 },
      }}
    >
      <LoadingSpinner size={60} />
      {message && (
        <Box
          sx={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: { xs: '0.6rem', sm: '0.8rem' },
            color: '#000',
            textAlign: 'center',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            maxWidth: '90%',
            lineHeight: 1.6,
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        >
          {message}
        </Box>
      )}
    </Box>
  );
}

