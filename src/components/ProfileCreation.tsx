import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Modal,
  Fade,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ProfileCreationProps {
  onSuccess: () => void;
  onBecomeMember: (
    name: string,
    profileUrl: string,
    description: string,
    xAccount: string
  ) => Promise<void>;
}

export default function ProfileCreation({
  onSuccess,
  onBecomeMember,
}: ProfileCreationProps) {
  const [formData, setFormData] = useState({
    name: '',
    profileUrl: '',
    description: '',
    xAccount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call the contract function
      await onBecomeMember(
        formData.name.trim(),
        formData.profileUrl.trim(),
        formData.description.trim(),
        formData.xAccount.trim()
      );

      // Show success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onSuccess();
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 600,
            width: '100%',
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '1.5rem',
              textAlign: 'center',
              marginBottom: 3,
            }}
          >
            CREATE YOUR PROFILE
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: '"Press Start 2P", sans-serif',
              fontSize: '0.7rem',
              textAlign: 'center',
              marginBottom: 4,
              lineHeight: 1.8,
            }}
          >
            Join the Respect Game and start earning RESPECT tokens
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              sx={{ marginBottom: 3 }}
              disabled={isSubmitting}
              placeholder="Your display name"
            />

            <TextField
              label="Profile Picture URL"
              fullWidth
              value={formData.profileUrl}
              onChange={(e) => handleChange('profileUrl', e.target.value)}
              sx={{ marginBottom: 3 }}
              disabled={isSubmitting}
              placeholder="https://..."
              helperText="Optional: Link to your profile picture"
            />

            <TextField
              label="Bio"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              sx={{ marginBottom: 3 }}
              disabled={isSubmitting}
              placeholder="Tell us about yourself..."
              helperText="Optional: A brief description about you"
            />

            <TextField
              label="X (Twitter) Account"
              fullWidth
              value={formData.xAccount}
              onChange={(e) => handleChange('xAccount', e.target.value)}
              sx={{ marginBottom: 3 }}
              disabled={isSubmitting}
              placeholder="@username"
              helperText="Optional: Your X/Twitter handle (you can verify it later)"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.875rem',
                padding: '1rem',
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                },
                marginTop: 2,
              }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                  <span>CREATING PROFILE...</span>
                </Box>
              ) : (
                'CREATE PROFILE'
              )}
            </Button>
          </form>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              marginTop: 3,
              textAlign: 'center',
              fontSize: '0.65rem',
              lineHeight: 1.6,
            }}
          >
            By creating a profile, you agree to participate in the Respect Game.
            Your profile will be stored on-chain.
          </Typography>
        </Paper>
      </Box>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        closeAfterTransition
      >
        <Fade in={showSuccessModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: 24,
              p: 4,
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: 'success.main',
                marginBottom: 2,
              }}
            />
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '1.2rem',
                marginBottom: 2,
              }}
            >
              PROFILE CREATED!
            </Typography>
            <Typography
              sx={{
                marginBottom: 3,
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              Your profile has been successfully created. You can now participate
              in the Respect Game!
            </Typography>
            <Button
              variant="contained"
              onClick={handleSuccessModalClose}
              sx={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.875rem',
                padding: '0.75rem 2rem',
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              CONTINUE
            </Button>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

