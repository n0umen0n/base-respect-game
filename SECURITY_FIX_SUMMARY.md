# Security Fix - Quick Summary

## 🚨 Problem

Your friend could edit your profile because the anon key had write permissions and RLS policies didn't work (they relied on `auth.uid()` which was always `null`).

## ✅ Solution Implemented

### New Architecture

```
Frontend (anon key) → READ ONLY
   ↓ (signs message with wallet)
Backend API (service_role key) → WRITE to database
   ↓ (verifies signature)
Supabase → Secured with RLS
```

## 📁 Files Created/Modified

### New Files

1. **`supabase/secure-rls-policies.sql`** - Locks down database (anon = read-only)
2. **`api/update-profile.ts`** - Secure backend API with signature verification
3. **`src/lib/secure-api.ts`** - Frontend helper for signing messages
4. **`SECURITY_FIX_GUIDE.md`** - Detailed documentation
5. **`apply-security-fix.sh`** - Setup helper script

### Modified Files

1. **`src/components/ProfilePage.tsx`** - Now uses secure API
2. **`src/lib/supabase-respect.ts`** - Deprecated vulnerable function

## 🚀 How to Apply (3 Steps)

### 1. Apply Database Security (5 minutes)

Open Supabase dashboard → SQL Editor → Run this file:

```
supabase/secure-rls-fix-respect-game.sql
```

This will:

- Remove the vulnerable "Allow X account updates" policy
- Keep read permissions (frontend can still view data)
- Only backend (service_role) can write

### 2. Set Environment Variables

**In Vercel Dashboard** (Settings → Environment Variables):

```bash
SUPABASE_SERVICE_KEY=your_service_role_key_here  # Get from Supabase Settings → API
```

**Keep this secret!** Never commit it or expose it in frontend.

### 3. Deploy & Test

```bash
git add .
git commit -m "Security fix: lock down database with RLS and signature verification"
git push
```

**Test it works:**

1. Go to your profile
2. Link Twitter/X account
3. Should see in console: "✅ Profile updated successfully"
4. Friend tries to edit your profile → Will fail with permission denied

## 🔐 What Changed

### Before (VULNERABLE)

```typescript
// Frontend could directly update database - INSECURE!
await supabase.from("members").update({ name: "hacked" });
```

### After (SECURE)

```typescript
// Frontend signs message proving wallet ownership
const result = await secureUpdateProfile(walletAddress, { name: "new name" });
// Backend verifies signature before updating
```

## ✅ Security Benefits

| Before                           | After                                       |
| -------------------------------- | ------------------------------------------- |
| ❌ Anyone could edit any profile | ✅ Only wallet owner can edit their profile |
| ❌ No verification               | ✅ Cryptographic signature required         |
| ❌ Anon key had write access     | ✅ Anon key is read-only                    |
| ❌ Friend edited your name       | ✅ Only you can edit your name              |

## 🧪 Quick Test

After deploying, test security in browser console:

```javascript
// This should FAIL with "permission denied"
const { error } = await supabase
  .from("members")
  .update({ name: "hacked" })
  .eq("wallet_address", "0x...");

console.log(error); // ✅ Should show permission error
```

## 📚 Documentation

- **Detailed Guide**: `SECURITY_FIX_GUIDE.md`
- **Setup Helper**: `./apply-security-fix.sh`

## 🆘 Troubleshooting

**"Permission denied" when updating profile?**

- Check `SUPABASE_SERVICE_KEY` is set in Vercel
- Verify you deployed the latest code
- Check browser console for signature errors

**API endpoint not found?**

- Verify `api/update-profile.ts` exists
- Redeploy to Vercel
- Check Vercel logs for errors

**Signature verification fails?**

- Make sure wallet is connected
- Try disconnecting and reconnecting wallet
- Check browser console for detailed error

## 🎉 Done!

Your database is now secure. The anon key exposed in the frontend can only READ data. All WRITES require cryptographic proof of wallet ownership through your backend API.

---

**Quick Start**: Run `./apply-security-fix.sh` for guided setup!
