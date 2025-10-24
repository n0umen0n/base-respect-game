import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Modal,
  Fade,
  Chip,
  IconButton,
} from '@mui/material';
import LoadingSpinner from './LoadingSpinner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import XIcon from '@mui/icons-material/X';
import CancelIcon from '@mui/icons-material/Cancel';
import ProfilePictureUpload from './ProfilePictureUpload';
import { uploadProfilePicture } from '../lib/supabase-respect';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useRespectGame } from '../hooks/useRespectGame';

interface ProfileCreationProps {
  onSuccess: () => void;
  walletAddress: string;
  onLoadingChange?: (loading: boolean) => void; // Callback to notify parent of loading state
}

export default function ProfileCreation({
  onSuccess,
  walletAddress,
  onLoadingChange,
}: ProfileCreationProps) {
  const { user, linkTwitter, unlinkTwitter } = usePrivy();
  const navigate = useNavigate();
  
  // Get smart wallet and blockchain functions
  const { smartAccountClient, smartAccountAddress } = useSmartWallet();
  const { becomeMember: becomeMemberOnChain } = useRespectGame({
    smartAccountClient,
    userAddress: smartAccountAddress,
    minimalMode: true,
  });
  const [formData, setFormData] = useState(() => {
    // Try to restore form data from sessionStorage
    const saved = sessionStorage.getItem('profile_form_data');
    return saved ? JSON.parse(saved) : {
      name: '',
      profileUrl: '',
      description: '',
    };
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [savedImagePreview, setSavedImagePreview] = useState<string | null>(() => {
    // Restore image preview from sessionStorage
    return sessionStorage.getItem('profile_image_preview');
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [linkingTwitter, setLinkingTwitter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notify parent of loading state changes
  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Component is ready after initial render
  React.useEffect(() => {
    setLoading(false);
  }, []);

  // Save form data to sessionStorage whenever it changes
  React.useEffect(() => {
    sessionStorage.setItem('profile_form_data', JSON.stringify(formData));
  }, [formData]);

  // Save image preview when image changes
  const handleImageSelect = (file: File | null) => {
    setProfileImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSavedImagePreview(dataUrl);
        sessionStorage.setItem('profile_image_preview', dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setSavedImagePreview(null);
      sessionStorage.removeItem('profile_image_preview');
    }
  };

  // Clear saved form data on success
  React.useEffect(() => {
    if (showSuccessModal) {
      sessionStorage.removeItem('profile_form_data');
      sessionStorage.removeItem('profile_image_preview');
    }
  }, [showSuccessModal]);

  // Get Twitter account from Privy user object
  const twitterAccount = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : '';
  const twitterVerified = (user?.twitter as any)?.verified || false;

  // Debug: Log Privy user data
  React.useEffect(() => {
    if (user) {
      console.log('Privy user data:', {
        id: user.id,
        hasTwitter: !!user.twitter,
        twitterUsername: user.twitter?.username,
        twitterVerified: (user.twitter as any)?.verified,
        twitterSubject: user.twitter?.subject,
        fullTwitterObject: user.twitter
      });
    }
  }, [user]);

  // Character limits
  const CHAR_LIMITS = {
    name: 50,
    description: 500,
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to convert data URL back to File
  const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
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

    if (formData.name.length > CHAR_LIMITS.name) {
      setError(`Name must be ${CHAR_LIMITS.name} characters or less`);
      return;
    }

    if (formData.description.length > CHAR_LIMITS.description) {
      setError(`Bio must be ${CHAR_LIMITS.description} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      let profileUrl = formData.profileUrl.trim();

      // Upload profile image if one was selected
      console.log('Image upload check:', {
        hasProfileImage: !!profileImage,
        hasSavedPreview: !!savedImagePreview,
        profileImageType: profileImage?.type,
        profileImageSize: profileImage?.size
      });

      if (profileImage) {
        setUploadProgress('Uploading image...');
        console.log('Uploading profile image:', profileImage.name);
        try {
          profileUrl = await uploadProfilePicture(profileImage, walletAddress);
          console.log('✅ Profile picture uploaded successfully:', profileUrl);
        } catch (uploadErr: any) {
          console.error('❌ Error uploading profile picture:', uploadErr);
          setError('Failed to upload profile picture. Please try again.');
          setIsSubmitting(false);
          setUploadProgress(null);
          return;
        }
      } else if (savedImagePreview) {
        // If we have a saved preview but no file (after Privy OAuth redirect),
        // convert the data URL back to a File
        setUploadProgress('Uploading image...');
        console.log('Converting saved image preview to file');
        try {
          const file = await dataURLtoFile(savedImagePreview, 'profile-picture.jpg');
          console.log('Converted file:', file.name, file.size, file.type);
          profileUrl = await uploadProfilePicture(file, walletAddress);
          console.log('✅ Profile picture uploaded from preview:', profileUrl);
        } catch (uploadErr: any) {
          console.error('❌ Error uploading saved profile picture:', uploadErr);
          // Don't fail - just skip the image upload
        }
      } else {
        console.log('No profile image to upload');
      }

      if (!smartAccountClient || !smartAccountAddress) {
        setError('Wallet not connected. Please refresh the page.');
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      setUploadProgress('Creating profile...');
      
      console.log('🎯 Creating profile on blockchain:', {
        name: formData.name.trim(),
        profileUrl,
        description: formData.description.trim()
      });
      
      // Call the contract function
      // NOTE: We pass empty string for X account to contract since we'll store it securely in DB
      await becomeMemberOnChain(
        formData.name.trim(),
        profileUrl,
        formData.description.trim(),
        '' // Don't store X account on-chain, only in DB for security
      );
      
      console.log('✅ Profile created on blockchain successfully!');

      // If user authenticated with X via Privy, save it to database
      // This is secure because it comes from Privy's verified OAuth
      if (twitterAccount && user?.twitter) {
        setUploadProgress('Saving X account...');
        
        console.log('Attempting to save X account:', {
          walletAddress,
          twitterAccount,
          twitterVerified,
          privyId: user.id
        });
        
        // Wait for webhook to create member in database (takes 3-4 seconds)
        // Try up to 3 times with increasing delays
        let saved = false;
        const delays = [3000, 2000, 2000]; // 3s, 2s, 2s = max 7 seconds
        
        for (let attempt = 0; attempt < delays.length && !saved; attempt++) {
          try {
            // Wait before attempt
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
            
            console.log(`Attempt ${attempt + 1}/${delays.length} to save X account`);
            
            // Call simple API (no signature required during profile creation)
            const response = await fetch('/api/save-x-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                walletAddress,
                xAccount: twitterAccount,
                xVerified: twitterVerified,
                privyDid: user.id,
              }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
              console.log('✅ X account saved to database successfully!');
              saved = true;
            } else {
              throw new Error(data.error || 'Failed to save X account');
            }
          } catch (xError: any) {
            console.log(`Attempt ${attempt + 1}/${delays.length} failed:`, xError.message);
            
            if (attempt === delays.length - 1) {
              console.error('❌ Failed to save X account after all attempts:', xError);
              // Show a warning but don't fail the profile creation
              setError('Profile created! X account will be linked automatically when you view your profile.');
            }
          }
        }
      }

      // Show success modal
      setShowSuccessModal(true);
      setUploadProgress(null);
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onSuccess();
    // Navigate to homepage after profile creation
    navigate('/');
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
            PROFILE CREATION
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
            PLEASE LET OTHERS KNOW WHO ARE THEY PLAYING WITH
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Nickname"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              sx={{ 
                marginBottom: 3,
                '& .MuiInputBase-input::placeholder': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  opacity: 0.6,
                }
              }}
              disabled={isSubmitting}
              placeholder="Your display name"
              inputProps={{ maxLength: CHAR_LIMITS.name }}
              helperText={`${formData.name.length}/${CHAR_LIMITS.name} characters`}
              FormHelperTextProps={{
                sx: {
                  fontSize: '0.65rem',
                  color: formData.name.length >= CHAR_LIMITS.name * 0.9 ? '#ff9800' : 'text.secondary',
                }
              }}
            />

            <ProfilePictureUpload
              onImageSelect={handleImageSelect}
              currentImageUrl={savedImagePreview || formData.profileUrl}
            />

            <TextField
              label="Bio"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              sx={{ 
                marginBottom: 3,
                '& .MuiInputBase-input::placeholder': {
                  fontFamily: '"Press Start 2P", sans-serif',
                  fontSize: '0.7rem',
                  opacity: 0.6,
                }
              }}
              disabled={isSubmitting}
              placeholder="Tell us about yourself..."
              inputProps={{ maxLength: CHAR_LIMITS.description }}
              helperText={`${formData.description.length}/${CHAR_LIMITS.description} characters - Optional`}
              FormHelperTextProps={{
                sx: {
                  fontSize: '0.65rem',
                  color: formData.description.length >= CHAR_LIMITS.description * 0.9 ? '#ff9800' : 'text.secondary',
                }
              }}
            />

            {/* Twitter Account Connection via Privy */}
            <Box sx={{ marginBottom: 3 }}>
              {!twitterAccount && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: '"Press Start 2P", sans-serif',
                    fontSize: '0.7rem',
                    marginBottom: 2,
                  }}
                >
                  ADD X ACCOUNT TO PROFILE
                </Typography>
              )}

              {!twitterAccount ? (
                <Box>
                  <Button
                    onClick={async () => {
                      try {
                        setLinkingTwitter(true);
                        await linkTwitter();
                      } catch (err) {
                        console.error('Failed to link Twitter:', err);
                      } finally {
                        setLinkingTwitter(false);
                      }
                    }}
                    disabled={isSubmitting || linkingTwitter}
                    variant="outlined"
                    startIcon={linkingTwitter ? <LoadingSpinner size={20} /> : <XIcon />}
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
                    {linkingTwitter ? 'CONNECTING...' : 'Connect'}
                  </Button>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      marginTop: 1,
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      lineHeight: 1.6,
                    }}
                  >
                    Optional: but it is a way to prove that it is you.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    padding: 2.5,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '2px solid #4CAF50',
                  }}
                >
                  {/* Left side: X icon and username */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <XIcon sx={{ fontSize: 36, color: '#000' }} />
                    
                    <Typography
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.85rem',
                        color: '#000',
                      }}
                    >
                      {twitterAccount}
                    </Typography>
                    
                    {twitterVerified && (
                      <CheckCircleIcon sx={{ fontSize: 20, color: '#1da1f2' }} />
                    )}
                  </Box>
                  
                  {/* Right side: AUTHENTICATED chip and disconnect icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label="AUTHENTICATED"
                      size="small"
                      color="success"
                      sx={{
                        fontFamily: '"Press Start 2P", sans-serif',
                        fontSize: '0.6rem',
                        height: 26,
                      }}
                    />
                    
                    <IconButton
                      onClick={async () => {
                        try {
                          await unlinkTwitter(user?.twitter?.subject || '');
                        } catch (err) {
                          console.error('Failed to unlink Twitter:', err);
                        }
                      }}
                      disabled={isSubmitting}
                      size="small"
                      sx={{
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#ffcdd2',
                        },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Box>

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
              }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LoadingSpinner size={24} color="#ffffff" />
                  <span>{uploadProgress || 'CREATING...'}</span>
                </Box>
              ) : (
                'CREATE PROFILE'
              )}
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                marginTop: 2,
                textAlign: 'center',
                fontSize: '0.65rem',
                lineHeight: 1.6,
                color: 'text.secondary',
              }}
            >
              By creating a profile, you agree to nothing, this is just a game.
            </Typography>
          </form>
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
                fontFamily: '"Press Start 2P", sans-serif',
                marginBottom: 3,
                fontSize: '0.7rem',
                lineHeight: 1.8,
              }}
            >
              Click "Play" on the homepage to participate in the Respect Game.
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

