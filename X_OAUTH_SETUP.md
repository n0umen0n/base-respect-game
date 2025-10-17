# X (Twitter) OAuth Authentication Setup Guide

This guide explains how to set up X OAuth authentication for verifying X account ownership in the Respect Game.

## Overview

Instead of users manually typing their X handle, they can now authenticate with X using OAuth 2.0. This ensures:

- ✅ **Verified ownership** - Users can only link X accounts they actually own
- ✅ **No impersonation** - Impossible to claim someone else's account
- ✅ **Automatic verification** - X verified status is captured automatically
- ✅ **Secure** - Uses OAuth 2.0 with PKCE (Proof Key for Code Exchange)

## Features

1. **OAuth 2.0 with PKCE** - Industry standard secure authentication
2. **Popup Flow** - Non-intrusive authentication in a popup window
3. **Verified Badge** - Automatically captures X verified status
4. **Disconnect Option** - Users can disconnect and reconnect anytime
5. **Optional** - X authentication remains optional during profile creation

---

## Step 1: Create X Developer Account

### 1.1 Sign Up for X Developer Account

1. Go to [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your X account
3. Apply for a developer account (if you haven't already)
4. Complete the application form
5. Wait for approval (usually instant for basic access)

### 1.2 Create a New Project

1. In the developer dashboard, click **"Create Project"**
2. Enter project details:
   - **Project name**: "Respect Game" (or your choice)
   - **Use case**: Choose the most relevant option
   - **Project description**: Brief description of your app

### 1.3 Create an App

1. After creating the project, click **"Create App"**
2. Enter app details:
   - **App name**: "Respect Game" (must be unique across X)
   - **App description**: Brief description
3. Click **"Complete"**

---

## Step 2: Configure OAuth 2.0 Settings

### 2.1 Enable OAuth 2.0

1. In your app dashboard, go to **"Settings"** tab
2. Scroll to **"User authentication settings"**
3. Click **"Set up"**

### 2.2 Configure OAuth Settings

Configure the following settings:

**App permissions**:

- ✅ Read (required)
- ❌ Write (not needed)
- ❌ Direct Messages (not needed)

**Type of App**:

- ✅ Web App

**App Info**:

- **Callback URI / Redirect URL**:

  ```
  Development: http://localhost:5173/auth/x/callback
  Production: https://yourdomain.com/auth/x/callback
  ```

  ⚠️ **Important**: Add both URLs if testing locally and in production

- **Website URL**: Your app's main URL
  ```
  Development: http://localhost:5173
  Production: https://yourdomain.com
  ```

**Save the settings**

### 2.3 Get Your Credentials

After saving, you'll see:

- **Client ID** - Copy this for your `.env.local` file
- **Client Secret** - You don't need this for PKCE flow

---

## Step 3: Configure Environment Variables

### 3.1 Add to `.env.local`

Create or update your `.env.local` file in the project root:

```bash
# X (Twitter) OAuth Configuration
VITE_X_CLIENT_ID=your_client_id_here
VITE_X_REDIRECT_URI=http://localhost:5173/auth/x/callback
```

### 3.2 Production Environment Variables

For production deployment (e.g., Vercel), add these environment variables:

```bash
VITE_X_CLIENT_ID=your_client_id_here
VITE_X_REDIRECT_URI=https://yourdomain.com/auth/x/callback
```

⚠️ **Important**: Make sure the redirect URI matches exactly what you configured in X Developer Portal.

---

## Step 4: Test the OAuth Flow

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Authentication

1. Navigate to the profile creation page
2. Click **"Connect X Account"** button
3. A popup window should open with X OAuth
4. Authorize the app
5. You should see your X handle connected with a green badge
6. If you're X verified, you'll see a blue checkmark

### 4.3 Verify Data Storage

After connecting, verify:

- X handle is displayed correctly (e.g., "@username")
- Verified status is captured (blue checkmark if verified)
- Can disconnect and reconnect successfully

---

## How It Works

### OAuth Flow Diagram

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   User      │      │  Your App    │      │  X (Twitter)│
└─────┬───────┘      └──────┬───────┘      └──────┬──────┘
      │                     │                     │
      │ 1. Click "Connect"  │                     │
      │────────────────────>│                     │
      │                     │ 2. Generate PKCE    │
      │                     │    code_verifier    │
      │                     │    code_challenge   │
      │                     │                     │
      │                     │ 3. Redirect to X    │
      │                     │────────────────────>│
      │                     │    with challenge   │
      │                     │                     │
      │ 4. User authorizes  │                     │
      │────────────────────────────────────────> │
      │                     │                     │
      │                     │ 5. Redirect back    │
      │                     │<────────────────────│
      │                     │    with auth code   │
      │                     │                     │
      │                     │ 6. Exchange code    │
      │                     │────────────────────>│
      │                     │    + code_verifier  │
      │                     │                     │
      │                     │ 7. Return token     │
      │                     │<────────────────────│
      │                     │                     │
      │                     │ 8. Get user info    │
      │                     │────────────────────>│
      │                     │    with token       │
      │                     │                     │
      │                     │ 9. Return profile   │
      │                     │<────────────────────│
      │                     │                     │
      │ 10. Show connected  │                     │
      │<────────────────────│                     │
      │    @username ✓      │                     │
```

### Technical Details

1. **PKCE (Proof Key for Code Exchange)**:

   - Generates a `code_verifier` (random 128-char string)
   - Creates `code_challenge` (SHA-256 hash of verifier)
   - Sends challenge to X, keeps verifier secret
   - X verifies the verifier matches the challenge

2. **State Parameter**:

   - Random string to prevent CSRF attacks
   - Stored in sessionStorage
   - Verified when X redirects back

3. **Popup Window**:

   - Opens X OAuth in a 600x700 popup
   - Uses `window.postMessage` for secure communication
   - Automatically closes after success/error

4. **Token Handling**:
   - Access token is used only to fetch user info
   - Token is NOT stored (not needed after getting user info)
   - Only username and verified status are saved

---

## Security Features

### 1. PKCE Protection

- Prevents authorization code interception attacks
- No client secret needed (secure for public clients)

### 2. State Parameter

- Prevents CSRF attacks
- Validated on callback

### 3. Origin Verification

- `postMessage` checks window.origin
- Only accepts messages from same origin

### 4. Session Storage

- OAuth state stored temporarily
- Cleared after completion

### 5. Database Security

- X account can only be set via OAuth
- Direct database updates are blocked
- Users can't claim accounts they don't own

---

## Troubleshooting

### "Popup blocked" Error

**Problem**: Browser blocks the OAuth popup

**Solution**:

1. Allow popups for your domain
2. Or users should click the button (popup blocking only affects automated popups)

### "Callback URI mismatch" Error

**Problem**: Redirect URI doesn't match X Developer Portal settings

**Solutions**:

1. Check `VITE_X_REDIRECT_URI` in `.env.local`
2. Verify callback URL in X Developer Portal matches exactly
3. Include port number for localhost (`:5173`)
4. No trailing slashes

### "Invalid Client ID" Error

**Problem**: Client ID is incorrect or missing

**Solutions**:

1. Verify `VITE_X_CLIENT_ID` in `.env.local`
2. Check you're using Client ID, not Client Secret
3. Restart development server after adding env variables

### OAuth Callback Not Working

**Problem**: Popup doesn't close or show error

**Solutions**:

1. Check browser console for errors
2. Verify `/auth/x/callback` route exists
3. Check network tab for API errors
4. Ensure X Developer Portal has correct callback URL

### User Info Not Fetched

**Problem**: Authentication succeeds but user info fails

**Solutions**:

1. Verify app permissions include "Read"
2. Check X API rate limits
3. Review X Developer Portal API access

---

## API Reference

### buildAuthorizationUrl()

Builds the X OAuth authorization URL with PKCE.

```typescript
buildAuthorizationUrl(): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}>
```

**Returns**:

- `url`: Full OAuth URL to redirect to
- `state`: Random state parameter (store for verification)
- `codeVerifier`: Code verifier (store for token exchange)

### exchangeCodeForToken()

Exchanges authorization code for access token.

```typescript
exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse>
```

**Parameters**:

- `code`: Authorization code from X callback
- `codeVerifier`: The code verifier generated earlier

**Returns**: Token response with `access_token`

### getXUserInfo()

Fetches X user information using access token.

```typescript
getXUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}>
```

**Returns**: User profile information

---

## Component Usage

### XAccountConnect Component

```tsx
<XAccountConnect
  onConnect={(account, verified) => {
    console.log("Connected:", account, verified);
  }}
  currentAccount={xAccount}
  currentVerified={xVerified}
  disabled={isSubmitting}
/>
```

**Props**:

- `onConnect`: Callback when X account is connected
- `currentAccount`: Current connected account (e.g., "@username")
- `currentVerified`: Whether account is X verified
- `disabled`: Disable the connect button

---

## Rate Limits

X API has rate limits:

- **OAuth endpoints**: Very high limits (rarely hit)
- **User info endpoint**: 75 requests per 15 minutes per user
- **Token exchange**: 15 requests per 15 minutes per app

For most applications, these limits are sufficient.

---

## Production Checklist

Before deploying to production:

- [ ] X Developer App is set to Production mode
- [ ] Production callback URL added to X Developer Portal
- [ ] Environment variables set in production environment
- [ ] OAuth flow tested in production
- [ ] HTTPS is enabled (required for OAuth in production)
- [ ] Error handling is working
- [ ] Analytics/logging set up for OAuth events

---

## Additional Resources

- [X OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [X API v2 User Lookup](https://developer.twitter.com/en/docs/twitter-api/users/lookup/introduction)
- [OAuth 2.0 PKCE RFC](https://tools.ietf.org/html/rfc7636)

---

## Support

Common issues and solutions:

1. **Environment variables not loading**: Restart dev server after adding `.env.local`
2. **Popup opens but nothing happens**: Check `/auth/x/callback` route exists
3. **"Invalid client" error**: Verify Client ID is correct
4. **Callback URI mismatch**: Ensure exact match with X Developer Portal

For more help, check the browser console for detailed error messages.

---

## Future Enhancements

Potential improvements:

1. **Refresh Tokens**: Store refresh tokens to update verification status
2. **Profile Sync**: Periodically sync X profile info
3. **Tweet Integration**: Allow posting from the app
4. **X Analytics**: Show user's X engagement stats
5. **Multiple Accounts**: Support linking multiple X accounts

---

**Note**: Make sure to configure the X Developer Portal before deploying to production!
