# X OAuth Troubleshooting Guide

## Problem: Endless Refresh Loop After Login

If you're seeing an endless refresh or the authorization modal flashing repeatedly, this means X is rejecting your OAuth request.

---

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console

1. Open the popup window
2. Press F12 to open Developer Tools
3. Look at the Console tab for errors
4. Look for messages like:
   - "X OAuth Callback - URL params"
   - Any red error messages

### Step 2: Check the Callback URL

When X redirects back, check if it includes an error:

```
http://localhost:5173/auth/x/callback?error=unauthorized_client&error_description=...
```

If you see `error=` in the URL, that's the problem X is reporting.

---

## ✅ Solution 1: App Environment (Most Common Issue)

**Problem**: Your X app is in **Development mode** and you're not added as a test user.

### Fix Option A: Switch to Production

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to **Settings** → **User authentication settings**
4. Click **Edit**
5. Scroll down to find environment settings
6. Switch from **Development** to **Production**
7. Save settings

⚠️ **Note**: Production mode may require additional app verification from X.

### Fix Option B: Add Yourself as Test User (Easier)

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to **Settings** → **User authentication settings**
4. Look for **OAuth 2.0 Client ID and Client Secret** section
5. Find **Test users** or similar option
6. Add your X username (without @)
7. Save

---

## ✅ Solution 2: Verify Callback URL

**Problem**: Callback URL doesn't match exactly what's registered.

### Steps:

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app → **Settings** → **User authentication settings**
3. Check **Callback URI / Redirect URL**
4. It should be **EXACTLY**: `http://localhost:5173/auth/x/callback`

### Common Mistakes:

❌ `http://localhost:5173/auth/x/callback/` (trailing slash)  
❌ `localhost:5173/auth/x/callback` (missing http://)  
❌ `http://localhost:5174/auth/x/callback` (wrong port)  
✅ `http://localhost:5173/auth/x/callback` (correct)

### If You Need to Add It:

1. Click **Edit** on User authentication settings
2. Under **Callback URI / Redirect URL**, click **+ Add**
3. Enter: `http://localhost:5173/auth/x/callback`
4. Save changes
5. **Wait 1-2 minutes** for changes to propagate
6. Try again

---

## ✅ Solution 3: Check App Permissions

**Problem**: Required scopes aren't enabled.

### Steps:

1. X Developer Portal → Your App → Settings → User authentication settings
2. **App permissions** should show:

   - ✅ **Read** (checked)
   - ❌ Write (unchecked - not needed)
   - ❌ Direct Messages (unchecked - not needed)

3. If "Read" is not checked:
   - Click **Edit**
   - Check **Read**
   - Save
   - Wait 1-2 minutes
   - Try again

---

## ✅ Solution 4: Verify OAuth 2.0 is Enabled

1. X Developer Portal → Your App → Settings
2. Look for **User authentication settings**
3. Should show **OAuth 2.0 is ON** or similar
4. If not enabled:
   - Click **Set up** or **Edit**
   - Enable **OAuth 2.0**
   - Configure settings as per X_OAUTH_SETUP.md
   - Save

---

## ✅ Solution 5: Check Client ID

**Problem**: Wrong or missing Client ID.

### Verify:

1. Check your `.env.local` file:

   ```bash
   VITE_X_CLIENT_ID=X1RiSU04S2lxTVhvdzY5ZEc1N1E6MTpjaQ
   ```

2. Compare with X Developer Portal:

   - Settings → User authentication settings
   - **Client ID** should match exactly

3. If different:
   - Copy correct Client ID from X Developer Portal
   - Update `.env.local`
   - **Restart your dev server**: `npm run dev`
   - Try again

---

## 🔍 Advanced Debugging

### Check Full OAuth URL

Look at the URL that opens in the popup:

```
https://twitter.com/i/oauth2/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:5173/auth/x/callback
  &scope=tweet.read+users.read
  &state=RANDOM_STATE
  &code_challenge=CHALLENGE
  &code_challenge_method=S256
```

**Verify**:

- `client_id` matches your Client ID
- `redirect_uri` is URL-encoded correctly
- `scope` includes both `tweet.read` and `users.read`

### Check Callback Response

When X redirects back, check the URL:

**Success:**

```
http://localhost:5173/auth/x/callback?code=XXXXX&state=XXXXX
```

**Error:**

```
http://localhost:5173/auth/x/callback?error=unauthorized_client&error_description=...
```

### Console Logs

With the updated code, you should see these logs:

1. In main window console:

```
Starting X OAuth flow: {
  clientId: "present",
  redirectUri: "present",
  state: "abc12345..."
}
```

2. In popup window console:

```
X OAuth Callback - URL params: {
  hasCode: true/false,
  hasState: true/false,
  error: null or error message,
  errorDescription: null or description,
  fullUrl: "..."
}
```

---

## 📋 Complete Checklist

Before trying again, verify:

- [ ] X Developer account is approved
- [ ] App is created in X Developer Portal
- [ ] OAuth 2.0 is enabled
- [ ] App is in **Production mode** OR you're added as a test user
- [ ] Callback URL is exactly: `http://localhost:5173/auth/x/callback`
- [ ] App permissions include **Read**
- [ ] Client ID is correct in `.env.local`
- [ ] Dev server was restarted after adding env variables
- [ ] Waited 1-2 minutes after making changes in X Developer Portal

---

## 🆘 Still Not Working?

### Step 1: Clear Everything

```bash
# Clear browser data
- Open DevTools → Application → Storage → Clear site data

# Clear sessionStorage manually
sessionStorage.clear()

# Restart dev server
npm run dev
```

### Step 2: Try Different Browser

Sometimes browser extensions can interfere. Try in:

- Chrome Incognito mode
- Firefox Private window
- Different browser entirely

### Step 3: Check X Status

Visit [X API Status](https://api.twitterstat.us/) to ensure X services are operational.

### Step 4: Create New App

If nothing works, try creating a fresh app in X Developer Portal:

1. Create new app with a different name
2. Set up OAuth 2.0 from scratch
3. Use new Client ID
4. Try authentication

---

## 📞 Get Help

If still stuck, collect this information:

1. **Console Logs**: Screenshot of browser console
2. **Callback URL**: From X Developer Portal
3. **Client ID**: First and last 4 characters only
4. **Error Message**: Any error shown in popup or console
5. **App Environment**: Development or Production?

Then check:

- [X Developer Community](https://twittercommunity.com/)
- [X API Documentation](https://developer.twitter.com/en/docs)

---

## 🎯 Most Common Solutions

**90% of issues are solved by**:

1. ✅ Adding yourself as a test user (Development mode)
2. ✅ OR switching to Production mode
3. ✅ Ensuring exact callback URL match
4. ✅ Restarting dev server after env changes

Try these first! 🚀
