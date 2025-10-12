# Environment Variables Setup

## Frontend Environment Variables (Vite)

Create a `.env.local` file in the root directory with:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
VITE_PIMLICO_API_KEY=
```

## Backend Environment Variables (Vercel)

Set these in your Vercel Dashboard → Settings → Environment Variables:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key... (KEEP SECRET!)
ALCHEMY_WEBHOOK_SIGNING_KEY=whsec_...your-signing-key...
```

## How to Get These Values

### Supabase Values

1. Go to your Supabase project
2. Settings → API
3. Copy:
   - `Project URL` → Use for both SUPABASE_URL and VITE_SUPABASE_URL
   - `anon public` key → Use for VITE_SUPABASE_ANON_KEY (safe for frontend)
   - `service_role` key → Use for SUPABASE_SERVICE_KEY (backend only!)

### Alchemy Signing Key

1. Go to Alchemy Dashboard
2. Your webhook → Settings
3. Copy the "Signing Key" (starts with `whsec_`)

## Security Notes

⚠️ **NEVER** commit `.env.local` to git  
⚠️ **NEVER** use service_role key in frontend  
✅ Use anon key in frontend (it's public-safe)  
✅ Use service_role key only in backend (Vercel functions)
