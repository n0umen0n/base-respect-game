# 🚨 Fix the Security Vulnerability NOW

## The Problem

Your friend could edit your profile because of this policy in your database (line 337 of `respect-game-schema.sql`):

```sql
CREATE POLICY "Allow X account updates" ON members
  FOR UPDATE USING (true) WITH CHECK (true);
```

This allowed **ANYONE** to update the `members` table!

## Quick Fix (5 minutes)

### Step 1: Fix the Database

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Open this file: `supabase/secure-rls-fix-respect-game.sql`
5. Copy ALL the contents
6. Paste into Supabase SQL Editor
7. Click **RUN** (the green play button)

You should see: `Success. No rows returned`

### Step 2: Verify It Worked

In the same SQL Editor, run this test:

```sql
-- Check that the vulnerable policy is gone
SELECT policyname
FROM pg_policies
WHERE tablename = 'members' AND policyname = 'Allow X account updates';
```

**Expected result**: `0 rows` (policy should not exist anymore)

### Step 3: Add Service Key to Vercel

1. Go to Supabase → Settings → API
2. Copy your **service_role** secret key (not the anon key!)
3. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
4. Add new variable:
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: (paste the service_role key)
   - Save

### Step 4: Deploy

```bash
git add .
git commit -m "Security fix: remove vulnerable RLS policy"
git push
```

## ✅ Done!

Your database is now secure. Test it:

1. Go to your live site
2. Open browser console
3. Try to hack yourself:

```javascript
const { error } = await supabase
  .from("members")
  .update({ name: "hacked" })
  .eq("wallet_address", "0x...");

console.log(error); // Should show "permission denied"
```

If you see "permission denied" - **you're secure!** 🎉

## What Changed?

**Before:**

- ❌ Anyone could update any profile
- ❌ Your friend edited your name

**After:**

- ✅ Only you can update your profile
- ✅ Requires wallet signature
- ✅ Friend gets "permission denied"

## Need Help?

- **Detailed Guide**: `SECURITY_FIX_GUIDE.md`
- **Quick Summary**: `SECURITY_FIX_SUMMARY.md`
- **Setup Script**: `./apply-security-fix.sh`

---

**TL;DR**: Run `supabase/secure-rls-fix-respect-game.sql` in Supabase, add `SUPABASE_SERVICE_KEY` to Vercel, deploy. Done! 🔒
