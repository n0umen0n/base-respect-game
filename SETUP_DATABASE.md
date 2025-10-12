# 🗄️ Database Setup Guide - Supabase + Alchemy Webhooks

This guide walks you through setting up the entire backend infrastructure for your app.

## 🎯 Architecture

```
React App → Smart Wallet → Base Network → Emits Events
                                ↓
                         Alchemy Webhook
                                ↓
                    Vercel Serverless Function
                                ↓
                         Supabase Database
                                ↓
                         React App (Display)
```

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `vladrespect` (or any name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine
5. Click **"Create new project"** (takes ~2 minutes)

### 1.2 Create Database Schema

Once your project is ready:

1. Go to **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Copy and paste the SQL from `supabase/schema.sql` (we'll create this)
4. Click **"Run"**

### 1.3 Get Your Credentials

Go to **Settings** → **API**:

- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbGc...` (public, safe for frontend)
- **service_role key**: `eyJhbGc...` (secret, for backend only!)

Save these - you'll need them!

---

## Step 2: Set Up Alchemy Webhook

### 2.1 Create Webhook

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Select your app (the one with Base network)
3. Go to **"Notify"** → **"Webhooks"**
4. Click **"Create Webhook"**
5. Choose **"Address Activity"**
6. Configure:
   - **Network**: Base Mainnet
   - **Address to watch**: `0x44aC2daE725b989Df123243A21C9b52b224B4273` (your contract)
   - **Webhook URL**: `https://your-app.vercel.app/api/webhook` (we'll deploy this)
   - **Events**: Select "Event Logs"
7. Click **"Create Webhook"**

### 2.2 Get Webhook Signing Key

1. After creating the webhook, click on it
2. Copy the **"Signing Key"** (looks like: `whsec_xxx`)
3. Save this - you'll use it to verify webhook authenticity

---

## Step 3: Deploy Vercel Serverless Function

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Set Up Environment Variables

Create `.env.local` file in your project root (we'll create this)

### 3.3 Deploy to Vercel

```bash
vercel
```

Follow the prompts:

- **Set up and deploy**: Yes
- **Which scope**: Your account
- **Link to existing project**: No
- **Project name**: vladrespect
- **Directory**: ./
- **Override settings**: No

After deployment, you'll get a URL like: `https://vladrespect.vercel.app`

### 3.4 Update Alchemy Webhook URL

Go back to Alchemy Dashboard:

1. Edit your webhook
2. Update **Webhook URL** to: `https://your-vercel-url.vercel.app/api/webhook`
3. Save

---

## Step 4: Configure Environment Variables in Vercel

Go to your Vercel project dashboard:

1. Click **"Settings"** → **"Environment Variables"**
2. Add these variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your service_role key (secret!)
   - `ALCHEMY_WEBHOOK_SIGNING_KEY`: Your webhook signing key
   - `VITE_SUPABASE_URL`: Same as SUPABASE_URL (for frontend)
   - `VITE_SUPABASE_ANON_KEY`: Your anon/public key (for frontend)
3. Click **"Save"**
4. Redeploy: `vercel --prod`

---

## Step 5: Test the Pipeline

### 5.1 Trigger a Test Event

1. In your React app, send a transaction (setNumber)
2. Wait for confirmation
3. Check Alchemy Dashboard → Your webhook → Recent deliveries
4. Should show a successful delivery (status 200)

### 5.2 Verify Database

Go to Supabase:

1. **Table Editor** → `transactions` table
2. You should see your transaction!
3. Check `leaderboard` table - should show updated stats

### 5.3 Check Frontend

Refresh your app - the leaderboard should display data from Supabase!

---

## 🔍 Debugging

### Webhook not firing?

- Check Alchemy Dashboard → Recent deliveries
- Verify contract address is correct
- Make sure "Event Logs" is selected

### Webhook returning errors?

- Check Vercel function logs: `vercel logs`
- Verify environment variables are set
- Check signing key is correct

### Database not updating?

- Check Supabase logs in Dashboard
- Verify service_role key is correct
- Check SQL schema was executed

### Frontend not showing data?

- Check browser console for errors
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Try fetching directly from Supabase REST API

---

## 📊 Monitoring

### Alchemy Webhooks

- View delivery history in Alchemy Dashboard
- Check success/failure rates
- See payload examples

### Vercel Functions

```bash
vercel logs --follow
```

### Supabase

- **Logs**: Database → Logs
- **API**: Settings → API Docs
- **Table Editor**: View/edit data manually

---

## 🔒 Security Checklist

✅ Never commit `.env.local` to git (it's in .gitignore)  
✅ Use service_role key only in backend (Vercel function)  
✅ Use anon key only in frontend  
✅ Verify webhook signatures in your function  
✅ Add Row Level Security (RLS) policies in Supabase  
✅ Rate limit your API endpoints

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ User sends transaction in UI
2. ✅ Transaction confirmed on Base
3. ✅ Alchemy webhook fires (check dashboard)
4. ✅ Vercel function processes it (check logs)
5. ✅ Data appears in Supabase (check table editor)
6. ✅ Frontend displays it (check leaderboard)

---

## 💡 Next Steps

Once basic pipeline works:

- Add more event types (NumberIncremented)
- Build user profiles
- Add realtime updates with Supabase subscriptions
- Create analytics dashboard
- Add caching with Redis

---

## 📞 Need Help?

Common issues and solutions are in the main README. Check there first!
