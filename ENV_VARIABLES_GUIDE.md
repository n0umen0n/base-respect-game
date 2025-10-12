# 🔑 Environment Variables Guide

## Two Different Locations!

### 📁 Frontend Variables (Local `.env` file)

**File Location**: `/Users/vlad/untitled folder/vladrespect/.env`

**Create this file with:**

```bash
# Frontend variables (MUST start with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
VITE_PIMLICO_API_KEY=pim_QLArWNZ7mLYArXrcmBFY5i
```

**Where to get values:**

- `VITE_SUPABASE_URL`: Supabase → Settings → API → **Project URL**
- `VITE_SUPABASE_ANON_KEY`: Supabase → Settings → API → **anon public** key
- `VITE_PIMLICO_API_KEY`: You already have this

---

### ☁️ Backend Variables (Vercel Dashboard)

**Location**: https://vercel.com/vladislav-hramtsovs-projects/base-respect-game/settings/environment-variables

**Add these 3 variables (NO VITE\_ prefix!):**

#### Variable 1:

```
Name: SUPABASE_URL
Value: https://your-project.supabase.co
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 2:

```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGc...your-service-role-key...
Environments: ✅ Production, ✅ Preview, ✅ Development
```

⚠️ Get from: Supabase → Settings → API → **service_role** (click "Reveal")

#### Variable 3:

```
Name: ALCHEMY_WEBHOOK_SIGNING_KEY
Value: whsec_xxxxx
Environments: ✅ Production, ✅ Preview, ✅ Development
```

Get from: Alchemy → Your Webhook → "Signing Key" button

---

## 🎯 Quick Reference

| What             | Frontend (.env)          | Backend (Vercel Dashboard)    |
| ---------------- | ------------------------ | ----------------------------- |
| **Prefix**       | `VITE_`                  | No prefix                     |
| **Supabase URL** | `VITE_SUPABASE_URL`      | `SUPABASE_URL`                |
| **Supabase Key** | `VITE_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_KEY`        |
| **Key Type**     | anon public              | service_role ⚠️               |
| **Pimlico**      | `VITE_PIMLICO_API_KEY`   | (not needed)                  |
| **Alchemy**      | (not needed)             | `ALCHEMY_WEBHOOK_SIGNING_KEY` |

---

## ⚡ Quick Command to Create .env

Run this in terminal:

```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...paste-your-anon-key-here...
VITE_PIMLICO_API_KEY=pim_QLArWNZ7mLYArXrcmBFY5i
EOF
```

Then **replace the values** with your actual credentials!

---

## 🔍 After Adding Vercel Variables

1. **Redeploy**: `vercel --prod`
2. **Send transaction** in your app
3. **Check Alchemy** - should show Status 200 ✅
4. **Check Supabase** - should have data! 🎉

---

**Need help finding the service_role key?**

Supabase Dashboard → Settings → API → Scroll to "service_role" → Click "Reveal" → Copy it!
