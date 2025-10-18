import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { exchangeCodeAndGetUser } from '../config/xAuth.config';

/**
 * X OAuth Callback Handler
 * This component handles the OAuth callback from X
 * and sends the verified account info back to the parent window
 */
export default function XAuthCallback() {
  // Debug: Log component mount
  console.log('XAuthCallback component mounted!', {
    url: window.location.href,
    search: window.location.search,
    timestamp: new Date().toISOString()
  });

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing X authentication...');
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    console.log('XAuthCallback useEffect running', { hasRun });
    
    // Prevent multiple executions
    if (hasRun) return;
    setHasRun(true);
    
    handleCallback();
  }, [hasRun]);

  const handleCallback = async () => {
    try {
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      // Log for debugging
      console.log('X OAuth Callback - URL params:', {
        hasCode: !!code,
        hasState: !!state,
        error,
        errorDescription,
        fullUrl: window.location.href,
        hasOpener: !!window.opener,
        isPopup: window.opener && !window.opener.closed
      });

      // Check if we're in a popup context
      if (!window.opener) {
        console.warn('No window.opener detected - this may not be a popup');
        // Try to use the page normally even without opener
        // This can happen if X redirects in a way that breaks the opener reference
      }

      // Check for OAuth errors
      if (error) {
        const errorMsg = errorDescription || error;
        throw new Error(`X OAuth error: ${errorMsg}`);
      }

      if (!code || !state) {
        throw new Error('Missing code or state parameter from X callback');
      }

      // Verify state matches
      const savedState = sessionStorage.getItem('x_oauth_state');
      if (state !== savedState) {
        throw new Error('State mismatch - potential CSRF attack');
      }

      // Get code verifier
      const codeVerifier = sessionStorage.getItem('x_oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      setMessage('Exchanging authorization code and fetching user info...');

      // Exchange code for token and get user info (via backend API)
      const userInfo = await exchangeCodeAndGetUser(code, codeVerifier);

      setMessage('Verifying account...');
      console.log('User info received:', userInfo);

      // Send success message to parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: 'X_OAUTH_SUCCESS',
              username: userInfo.username,
              verified: userInfo.verified || false,
              name: userInfo.name,
              id: userInfo.id,
            },
            window.location.origin
          );
          console.log('Successfully sent message to parent window');
        } catch (err) {
          console.error('Failed to send message to parent:', err);
        }
      } else {
        console.warn('No parent window available to send message to');
      }

      setStatus('success');
      setMessage('Successfully connected! You can close this window.');

      // Clean up session storage
      sessionStorage.removeItem('x_oauth_state');
      sessionStorage.removeItem('x_oauth_code_verifier');
      sessionStorage.removeItem('x_oauth_in_progress');

      // Try to close window after a short delay
      setTimeout(() => {
        try {
          window.close();
        } catch (err) {
          console.log('Could not auto-close window, user can close manually');
        }
      }, 2000);

    } catch (err: any) {
      console.error('X OAuth callback error:', err);
      
      setStatus('error');
      setMessage(err.message || 'Failed to connect X account');

      // Send error message to parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: 'X_OAUTH_ERROR',
              error: err.message || 'Authentication failed',
            },
            window.location.origin
          );
        } catch (postErr) {
          console.error('Failed to send error to parent:', postErr);
        }
      }

      // Clean up and close after delay
      setTimeout(() => {
        sessionStorage.removeItem('x_oauth_state');
        sessionStorage.removeItem('x_oauth_code_verifier');
        sessionStorage.removeItem('x_oauth_in_progress');
        try {
          window.close();
        } catch (closeErr) {
          console.log('Could not auto-close window');
        }
      }, 3000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        backgroundColor: '#f5f5f5',
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ marginBottom: 3 }} />
          <Typography
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginBottom: 2,
            }}
          >
            CONNECTING X ACCOUNT
          </Typography>
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            {message}
          </Typography>
        </>
      )}

      {status === 'success' && (
        <Alert severity="success" sx={{ maxWidth: 500 }}>
          <Typography
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.8rem',
              marginBottom: 1,
            }}
          >
            SUCCESS!
          </Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>
            {message}
          </Typography>
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.8rem',
              marginBottom: 1,
            }}
          >
            ERROR
          </Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>
            {message}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

