import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';

interface ProfilePictureUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImageUrl?: string;
}

export default function ProfilePictureUpload({
  onImageSelect,
  currentImageUrl,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('Image size must be less than 20MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
        PROFILE PICTURE
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Preview Avatar */}
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <Avatar
            src={preview || undefined}
            sx={{
              width: 150,
              height: 150,
              borderRadius: 4,
              border: '3px solid #e0e0e0',
              backgroundColor: preview ? 'transparent' : '#f5f5f5',
            }}
          >
            {!preview && <PhotoCameraIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />}
          </Avatar>

          {preview && (
            <IconButton
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: '#f44336',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
                width: 36,
                height: 36,
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Upload Button */}
        <Button
          variant="outlined"
          onClick={handleClick}
          startIcon={<PhotoCameraIcon />}
          sx={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.65rem',
            padding: '0.75rem 1.5rem',
          }}
        >
          {preview ? 'CHANGE PICTURE' : 'UPLOAD PICTURE'}
        </Button>

        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Optional: JPG, PNG or GIF (Max 20MB)
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', fontSize: '0.75rem' }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}

