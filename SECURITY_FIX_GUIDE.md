# Security Vulnerability Fix Guide

## 🚨 Problem Identified

**Critical Security Vulnerability**: The Supabase anon key was exposed in the frontend with write permissions enabled through Row Level Security (RLS) policies that relied on `auth.uid()`. Since the application doesn't use Supabase Auth, `auth.uid()` was always `null`, effectively allowing **anyone to modify any data in the database**.

### What Was Vulnerable

1. **RLS Policy Flaw** (in `respect-game-schema.sql` line 337):

   ```sql
   -- THIS IS THE VULNERABILITY!
   CREATE POLICY "Allow X account updates" ON members
     FOR UPDATE USING (true) WITH CHECK (true);
   ```

   - This policy allowed **ANYONE** to update the `members` table
   - `USING (true)` means no restrictions on who can update
   - `WITH CHECK (true)` means no validation on what can be updated
   - Anyone with the anon key could modify any profile

2. **Direct Frontend Writes** (in `supabase-respect.ts`):
   ```typescript
   // VULNERABLE - Anyone could call this!
   await supabase.from("members").update({...})
   ```
   - Frontend code directly updated database
   - No signature verification
   - No proof of wallet ownership

## ✅ Solution Implemented

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │      │   Backend    │      │   Supabase   │
│  (anon key) │─────▶│ (service key)│─────▶│   Database   │
│             │      │              │      │              │
│ READ ONLY   │      │  READ/WRITE  │      │   Secure     │
└─────────────┘      └──────────────┘      └──────────────┘
     │                       │
     │ 1. Sign message       │
     │ 2. Send signature     │
     └──────────────────────▶│
                             │ 3. Verify signature
                             │ 4. Update database
```

### 1. Secure RLS Policies

**File**: `supabase/secure-rls-policies.sql`

- ✅ Anon key can **ONLY SELECT** (read) data
- ✅ No INSERT/UPDATE/DELETE policies for anon key
- ✅ Only backend with service_role key can write
- ✅ All tables protected with RLS enabled

### 2. Secure Backend API

**File**: `api/update-profile.ts`

Features:

- ✅ **Wallet Signature Verification**: Requires cryptographic proof of wallet ownership
- ✅ **Service Role Key**: Uses backend-only key that bypasses RLS
- ✅ **Replay Attack Protection**: Timestamp validation (5-minute window)
- ✅ **Input Validation**: Checks data length and format
- ✅ **Message Verification**: Ensures signed message contains wallet address

### 3. Secure Frontend Helper

**File**: `src/lib/secure-api.ts`

Features:

- ✅ **Message Signing**: Signs messages with user's wallet
- ✅ **Timestamp Protection**: Includes timestamp to prevent replay attacks
- ✅ **Provider Support**: Works with Privy embedded wallets
- ✅ **Error Handling**: Clear error messages for debugging

### 4. Updated Components

**Files Updated**:

- `src/components/ProfilePage.tsx` - Uses secure API instead of direct updates
- `src/lib/supabase-respect.ts` - Deprecated vulnerable functions

## 📋 Setup Instructions

### Step 1: Apply Database Security

Run the SQL migration in your Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of: `supabase/secure-rls-fix-respect-game.sql`
3. Click **Run**

**IMPORTANT**: After running this, test that anon key cannot write:

```sql
-- As anon user, this should FAIL:
UPDATE members SET name='hacked' WHERE wallet_address='0x...';
-- Expected: "permission denied for table members"
```

### Step 2: Verify Environment Variables

Ensure these are set in Vercel (or `.env.local` for local dev):

```bash
# Backend only (DO NOT expose to frontend!)
SUPABASE_SERVICE_KEY=eyJhbG... # service_role key

# Frontend (safe to expose)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... # anon key (read-only after fix)
```

### Step 3: Deploy Backend API

The new API endpoint `api/update-profile.ts` will be deployed automatically with Vercel.

Verify it's working:

```bash
# Should return 405 Method Not Allowed
curl https://your-domain.vercel.app/api/update-profile
```

### Step 4: Test the Secure Flow

1. Go to your profile page
2. Try linking Twitter/X account
3. Check browser console for:
   ```
   📝 Signing message: Update profile for 0x...
   ✅ Message signed successfully
   ✅ Profile updated successfully
   ```

## 🔒 Security Benefits

### Before Fix

- ❌ Anyone could modify any profile
- ❌ No verification of wallet ownership
- ❌ Anon key had write permissions
- ❌ Friend could edit your profile name

### After Fix

- ✅ Only wallet owner can update their profile
- ✅ Cryptographic signature verification
- ✅ Anon key is read-only
- ✅ Backend validates all requests
- ✅ Replay attack protection
- ✅ Service role key kept secret

## 🧪 Testing Security

### Test 1: Verify Read-Only Access

```javascript
// In browser console (should FAIL)
const { data, error } = await supabase
  .from("members")
  .update({ name: "hacked" })
  .eq("wallet_address", "0x...");

console.log(error); // Should show permission denied
```

### Test 2: Verify Signature Required

```bash
# Try to update without signature (should fail with 401)
curl -X POST https://your-domain.vercel.app/api/update-profile \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x123", "updates": {"name": "hacked"}}'
```

### Test 3: Verify Timestamp Validation

```javascript
// Try with old timestamp (should fail with 401)
const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
// Should return: "Signature expired or invalid timestamp"
```

## 🔐 Best Practices Going Forward

### ✅ DO

1. **Always use secure API** for any database writes
2. **Verify signatures** for all user actions
3. **Keep service_role key secret** - never in frontend
4. **Test RLS policies** regularly
5. **Use read-only keys** in frontend (anon key after this fix)
6. **Add rate limiting** to backend APIs (future improvement)

### ❌ DON'T

1. **Never expose service_role key** to frontend/public
2. **Never trust frontend input** without verification
3. **Never skip signature verification**
4. **Never use deprecated functions** (like old `updateMemberXAccount`)
5. **Never commit .env files** with secrets

## 📚 Additional Security Improvements (Recommended)

### 1. Rate Limiting

Add to `api/update-profile.ts`:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
});
```

### 2. CORS Restrictions

Update CORS in `api/update-profile.ts`:

```typescript
// Change from "*" to your actual domain
res.setHeader("Access-Control-Allow-Origin", "https://your-domain.vercel.app");
```

### 3. Monitoring

Add logging/alerting for:

- Failed signature verifications
- Unusual update patterns
- High frequency requests from same IP

### 4. Backup Strategy

Enable Point-in-Time Recovery in Supabase:

- Dashboard → Settings → Database → Point-in-Time Recovery
- Can restore to any point in last 7 days

## 🆘 Emergency Response

If you suspect database tampering:

1. **Immediate**: Rotate service_role key in Supabase dashboard
2. **Check logs**: Review Supabase logs for suspicious queries
3. **Restore data**: Use Point-in-Time Recovery if needed
4. **Audit**: Check all RLS policies are correct
5. **Update keys**: Update SUPABASE_SERVICE_KEY in Vercel

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Vercel logs for API errors
3. Verify environment variables are set
4. Test RLS policies in Supabase SQL Editor
5. Ensure wallet is connected and signing properly

## ✅ Verification Checklist

- [ ] Applied `secure-rls-policies.sql` to Supabase
- [ ] Tested anon key cannot write (permission denied)
- [ ] Verified `api/update-profile.ts` is deployed
- [ ] Confirmed SUPABASE_SERVICE_KEY is set in Vercel
- [ ] Tested profile update with signature works
- [ ] Removed or deprecated old vulnerable functions
- [ ] Updated frontend to use secure API
- [ ] Tested that unauthorized updates fail

## 🎉 Result

Your database is now secure! Users can only modify their own data after proving wallet ownership through cryptographic signatures. The anon key in the frontend is now truly "anonymous" with read-only access, while all writes go through your secure backend that validates every request.

---

**Created**: October 22, 2025
**Last Updated**: October 22, 2025
**Status**: ✅ Security vulnerability patched
