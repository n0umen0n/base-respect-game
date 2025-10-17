# Profile Picture Upload Setup Guide

This guide explains how to set up Supabase Storage for profile picture uploads in the Respect Game.

## Features Added

1. **Profile Picture Upload Component** - A user-friendly upload interface with image preview
2. **Automatic Upload to Supabase Storage** - Images are uploaded before profile creation
3. **Display Across the App** - Profile pictures are shown on:
   - Homepage leaderboard
   - User profile page
   - Contribution ranking page
   - Profile cards

## Supabase Storage Setup

### Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Create a bucket with the following settings:
   - **Name**: `respect-game-profiles`
   - **Public bucket**: ✓ (checked)
   - **File size limit**: 5MB (optional but recommended)
   - **Allowed MIME types**: `image/*` (optional but recommended)

### Step 2: Set Bucket Policies

After creating the bucket, set up the following policies:

#### Policy 1: Public Read Access

```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'respect-game-profiles');
```

#### Policy 2: Authenticated Upload

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'respect-game-profiles'
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Users Can Update Their Own Files (Optional)

```sql
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'respect-game-profiles')
WITH CHECK (bucket_id = 'respect-game-profiles');
```

### Step 3: Configure File Size and Types (Optional)

In the Supabase Storage settings for the bucket:

- **Maximum file size**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

## How It Works

### 1. User Flow

1. User navigates to profile creation page
2. Clicks on the profile picture upload area
3. Selects an image from their device (max 5MB)
4. Image preview is shown immediately
5. On form submission:
   - Image is uploaded to Supabase Storage
   - Public URL is obtained
   - Profile is created on-chain with the image URL
   - Image URL is stored in the database

### 2. Technical Implementation

**Upload Function** (`src/lib/supabase-respect.ts`):

```typescript
export async function uploadProfilePicture(
  file: File,
  walletAddress: string
): Promise<string>;
```

**Component** (`src/components/ProfilePictureUpload.tsx`):

- Handles file selection
- Validates file type and size
- Shows image preview
- Provides UI for upload/remove

**Integration** (`src/components/ProfileCreation.tsx`):

- Manages upload state
- Shows upload progress
- Handles errors gracefully

### 3. File Naming Convention

Files are stored with unique names to prevent conflicts:

```
profile-pictures/{walletAddress}-{timestamp}.{extension}
```

Example: `profile-pictures/0x1234...5678-1697123456789.jpg`

## Database Schema

The `members` table already has a `profile_url` field:

```sql
profile_url VARCHAR(500)
```

This field stores the public URL of the uploaded profile picture.

## Testing

### Test the Upload Feature

1. **Profile Creation**:

   - Navigate to profile creation (as a new user)
   - Upload a profile picture
   - Fill in other details
   - Submit the form
   - Verify the image appears on your profile

2. **Display Verification**:
   - Check homepage leaderboard
   - Check your profile page
   - Check ranking submission page (if applicable)

### Test Fallback Behavior

1. Create a profile without uploading an image
2. Verify the default placeholder image is shown
3. Confirm no errors occur

### Test Error Handling

1. Try uploading a file larger than 5MB
2. Try uploading a non-image file
3. Verify appropriate error messages are shown

## Troubleshooting

### Images Not Uploading

**Problem**: Upload fails with error message

**Solutions**:

1. Verify the storage bucket `respect-game-profiles` exists
2. Check that the bucket is public
3. Verify the bucket policies are set correctly
4. Check browser console for specific errors
5. Ensure user is authenticated with Privy

### Images Not Displaying

**Problem**: Images upload successfully but don't display

**Solutions**:

1. Check that the bucket is set to public
2. Verify the public URL is correct in the database
3. Check browser console for CORS errors
4. Verify the `profile_url` field in the database is populated

### File Size Errors

**Problem**: Users can't upload images

**Solutions**:

1. Check if image is larger than 5MB (compress it)
2. Verify the file is an image type (jpg, png, gif)
3. Try a different image format

## Security Considerations

1. **File Size Limit**: 5MB per image prevents abuse
2. **File Type Validation**: Only images are accepted
3. **Unique File Names**: Prevents overwriting other users' images
4. **Public Access**: Images are public (required for display)
5. **Authenticated Upload**: Only authenticated users can upload

## Future Enhancements

Potential improvements for the profile picture system:

1. **Image Compression**: Automatically compress images before upload
2. **Image Cropping**: Allow users to crop/resize images
3. **Multiple Sizes**: Generate thumbnail versions
4. **Image Moderation**: Manual or automated content moderation
5. **Delete Old Images**: Clean up replaced profile pictures
6. **CDN Integration**: Use a CDN for faster image loading

## API Reference

### uploadProfilePicture

Uploads a profile picture to Supabase Storage.

```typescript
uploadProfilePicture(file: File, walletAddress: string): Promise<string>
```

**Parameters**:

- `file`: The image file to upload
- `walletAddress`: The user's wallet address (for unique naming)

**Returns**: Promise that resolves to the public URL of the uploaded image

**Throws**: Error if upload fails

## Support

If you encounter issues:

1. Check the Supabase dashboard for storage errors
2. Review browser console for JavaScript errors
3. Verify environment variables are set correctly
4. Check that Supabase Storage service is operational

---

**Note**: Make sure to set up the Supabase Storage bucket before deploying to production!
