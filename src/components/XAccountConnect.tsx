import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import XIcon from '@mui/icons-material/X';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { buildAuthorizationUrl } from '../config/xAuth.config';

interface XAccountConnectProps {
  onConnect: (xAccount: string, xVerified: boolean) => void;
  currentAccount?: string;
  currentVerified?: boolean;
  disabled?: boolean;
}

export default function XAccountConnect({
  onConnect,
  currentAccount,
  currentVerified,
  disabled = false,
}: XAccountConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(!!currentAccount);
  const [connectedAccount, setConnectedAccount] = useState(currentAccount || '');
  const [isVerified, setIsVerified] = useState(currentVerified || false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build authorization URL with PKCE
      const { url, state, codeVerifier } = await buildAuthorizationUrl();

      console.log('Starting X OAuth flow:', {
        clientId: url.includes('client_id') ? 'present' : 'missing',
        redirectUri: url.includes('redirect_uri') ? 'present' : 'missing',
        state: state.substring(0, 8) + '...',
      });

      // Store state and code verifier in sessionStorage for verification
      sessionStorage.setItem('x_oauth_state', state);
      sessionStorage.setItem('x_oauth_code_verifier', codeVerifier);
      
      // Store callback flag to know we need to handle the callback
      sessionStorage.setItem('x_oauth_in_progress', 'true');

      // Open X OAuth in popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'X OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for callback message from popup
      const handleMessage = async (event: MessageEvent) => {
        // Verify origin
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'X_OAUTH_SUCCESS') {
          const { username, verified } = event.data;
          
          setConnectedAccount(`@${username}`);
          setIsVerified(verified || false);
          setIsConnected(true);
          setLoading(false);
          
          // Notify parent component
          onConnect(`@${username}`, verified || false);
          
          // Clean up
          window.removeEventListener('message', handleMessage);
          popup?.close();
        } else if (event.data.type === 'X_OAUTH_ERROR') {
          setError(event.data.error || 'Failed to connect X account');
          setLoading(false);
          window.removeEventListener('message', handleMessage);
          popup?.close();
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (loading) {
            setLoading(false);
            setError('Authentication cancelled');
          }
        }
      }, 1000);

    } catch (err: any) {
      console.error('Error connecting X account:', err);
      setError(err.message || 'Failed to connect X account');
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectedAccount('');
    setIsVerified(false);
    onConnect('', false);
  };

  return (
    <Box sx={{ marginBottom: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{
          fontFamily: '"Press Start 2P", sans-serif',
          fontSize: '0.7rem',
          marginBottom: 2,
        }}
      >
        X (TWITTER) ACCOUNT
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}

      {!isConnected ? (
        <Box>
          <Button
            onClick={handleConnect}
            disabled={disabled || loading}
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <XIcon />}
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.65rem',
              padding: '0.75rem 1.5rem',
              borderColor: '#000',
              color: '#000',
              '&:hover': {
                borderColor: '#333',
                backgroundColor: 'rgba(0,0,0,0.05)',
              },
            }}
          >
            {loading ? 'CONNECTING...' : 'CONNECT X ACCOUNT'}
          </Button>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              marginTop: 1,
              fontSize: '0.65rem',
              color: 'text.secondary',
            }}
          >
            Optional: Connect your X account to verify ownership
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            border: '2px solid #4CAF50',
          }}
        >
          <XIcon sx={{ fontSize: 32, color: '#000' }} />
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
              <Typography
                sx={{
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.8rem',
                }}
              >
                {connectedAccount}
              </Typography>
              {isVerified && (
                <CheckCircleIcon sx={{ fontSize: 18, color: '#1da1f2' }} />
              )}
            </Box>
            
            <Chip
              label="CONNECTED"
              size="small"
              color="success"
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.55rem',
                height: 24,
              }}
            />
          </Box>

          <IconButton
            onClick={handleDisconnect}
            disabled={disabled}
            sx={{
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
              },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

