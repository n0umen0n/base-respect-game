# 🚀 Database Integration - Quick Start Guide

This guide will help you set up the full database pipeline in ~30 minutes.

## 📋 What You're Building

```
User Sets Number in UI
         ↓
Smart Wallet Transaction → Base Blockchain
         ↓
Event Emitted: NumberSet(333, 0x...)
         ↓
Alchemy Webhook fires
         ↓
Vercel Function processes event
         ↓
Saves to Supabase Database
         ↓
Frontend displays updated leaderboard
```

---

## ✅ Step-by-Step Setup

### Step 1: Create Supabase Project (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - Name: `vladrespect`
   - Database Password: (Generate and save it!)
   - Region: Choose closest to you
5. Click **"Create new project"** (waits ~2 min)

### Step 2: Run Database Schema (2 minutes)

1. In Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **"Run"**
5. You should see: ✅ Success

**Tables Created:**

- `users` - User profiles
- `transactions` - All blockchain transactions
- `leaderboard` - Rankings and stats
- `achievements` - User achievements
- `global_stats` - App-wide statistics

### Step 3: Get Supabase Credentials (1 minute)

In Supabase Dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (for frontend)
   - **service_role** key: `eyJhbGc...` (for backend - keep secret!)

### Step 4: Create Environment Variables (2 minutes)

Create `.env.local` in your project root:

```bash
# Frontend (safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
VITE_PIMLICO_API_KEY=pim_QLArWNZ7mLYArXrcmBFY5i

# Backend (DO NOT expose - will set in Vercel later)
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key...
ALCHEMY_WEBHOOK_SIGNING_KEY=whsec_...your-signing-key...
```

### Step 5: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: vladrespect
# - Directory: ./
# - Override settings: No
```

**Save your deployment URL!** (e.g., `https://vladrespect.vercel.app`)

### Step 6: Set Vercel Environment Variables (3 minutes)

Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these 3 variables:

1. `SUPABASE_URL` = Your Supabase project URL
2. `SUPABASE_SERVICE_KEY` = Your service_role key ⚠️
3. `ALCHEMY_WEBHOOK_SIGNING_KEY` = (We'll get this next)

Click **Save** after each one.

### Step 7: Create Alchemy Webhook (5 minutes)

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Select your Base app
3. Go to **"Notify"** → **"Webhooks"**
4. Click **"Create Webhook"**
5. Configure:
   - **Type**: Address Activity
   - **Network**: Base Mainnet
   - **Address**: `0x44aC2daE725b989Df123243A21C9b52b224B4273`
   - **Webhook URL**: `https://your-vercel-url.vercel.app/api/webhook`
   - **Events**: ✅ Event Logs
6. Click **"Create Webhook"**
7. **COPY THE SIGNING KEY** (looks like: `whsec_xxx`)

### Step 8: Update Vercel with Signing Key (2 minutes)

1. Go back to Vercel → Settings → Environment Variables
2. Edit `ALCHEMY_WEBHOOK_SIGNING_KEY`
3. Paste the signing key from Alchemy
4. Click **Save**
5. Redeploy: `vercel --prod`

### Step 9: Test the Pipeline! (5 minutes)

1. **Open your app**: Go to `https://your-vercel-url.vercel.app`
2. **Log in** with Privy
3. **Go to Dashboard**
4. **Set a number** (e.g., 333)
5. **Wait for confirmation**

**Check if it worked:**

#### A. Check Alchemy Webhook

- Alchemy Dashboard → Your Webhook → **Recent Deliveries**
- Should show: ✅ Status 200 (success)

#### B. Check Supabase Database

- Supabase → **Table Editor** → `transactions` table
- You should see your transaction!
- Check `leaderboard` table → Your wallet should be there!

#### C. Check Frontend

- Your app homepage should now show the leaderboard (if you add the component)

---

## 🎨 Display Data in Your Frontend

### Option 1: Quick Test

Add to your `src/components/HomePage.jsx`:

```jsx
import Leaderboard from "./Leaderboard";

function HomePage() {
  return (
    <div>
      {/* Your existing content */}
      <Leaderboard />
    </div>
  );
}
```

### Option 2: Fetch Data Yourself

```jsx
import { useEffect, useState } from "react";
import { getLeaderboard } from "../lib/api";

function MyComponent() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
    }
    fetchData();
  }, []);

  return (
    <div>
      {leaderboard.map((entry) => (
        <div key={entry.wallet_address}>
          {entry.username || entry.wallet_address}: {entry.current_number}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 Debugging

### Webhook not firing?

```bash
# Check Alchemy Dashboard
Notify → Your Webhook → Recent Deliveries

# Common issues:
- Contract address wrong
- Event Logs not selected
- Webhook URL incorrect
```

### Webhook returning errors?

```bash
# View Vercel function logs
vercel logs --follow

# Common issues:
- Environment variables not set
- Signing key incorrect
- Supabase credentials wrong
```

### Database not updating?

```sql
-- Check in Supabase SQL Editor
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM leaderboard ORDER BY current_number DESC LIMIT 5;

-- Common issues:
- Schema not executed
- RLS policies blocking
- service_role key wrong
```

### Frontend not showing data?

```javascript
// Check browser console
// Common issues:
- VITE_SUPABASE_URL not set
- VITE_SUPABASE_ANON_KEY not set
- Restart dev server after adding env vars
```

---

## 🎯 Success Checklist

- ✅ Supabase project created
- ✅ Database schema executed
- ✅ Environment variables configured
- ✅ Deployed to Vercel
- ✅ Alchemy webhook created
- ✅ Test transaction sent
- ✅ Data appears in Supabase
- ✅ Frontend displays leaderboard

---

## 📚 Files You Created

```
📁 Your Project
├── supabase/
│   └── schema.sql          ← Database schema
├── api/
│   └── webhook.ts          ← Webhook handler
├── src/
│   ├── lib/
│   │   ├── supabase.ts     ← Supabase client
│   │   └── api.ts          ← API utilities
│   └── components/
│       └── Leaderboard.tsx ← Example component
├── vercel.json             ← Vercel config
├── .env.local              ← Your secrets (local)
└── ENV_SETUP.md            ← Env var reference
```

---

## 🚀 Next Steps

Now that the pipeline works, you can:

1. **Add more components**:

   - Recent transactions feed
   - User profile pages
   - Global stats dashboard
   - Achievements display

2. **Add realtime updates**:

   - Use `subscribeToLeaderboard()` for live updates
   - Show notifications when new transactions arrive

3. **Enhance user profiles**:

   - Let users set usernames/avatars
   - Show their transaction history
   - Display their achievements

4. **Add analytics**:
   - Track most active times
   - Show total gas saved
   - Display network-wide stats

---

## 💡 Pro Tips

1. **Use Views**: The schema includes helpful views like `top_leaderboard` and `recent_transactions` - use them!

2. **Realtime Updates**: Supabase supports realtime subscriptions - use `subscribeToLeaderboard()` for live updates

3. **Row Level Security**: The schema includes RLS policies - they're already set up correctly

4. **Testing**: Use Base Sepolia testnet first (free!), then switch to mainnet

5. **Monitoring**: Check Vercel logs regularly: `vercel logs --follow`

---

## 🆘 Need Help?

- **Supabase Issues**: Check `SETUP_DATABASE.md`
- **Webhook Issues**: Check Alchemy Dashboard logs
- **Frontend Issues**: Check browser console
- **Database Issues**: Check Supabase logs

---

**You did it! 🎉** Your app now has a full database backend with realtime updates!
