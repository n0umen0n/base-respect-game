# Vercel Deployment Fix Summary

## Problems Found & Fixed ✅

### 1. **Frontend: Missing Supabase Environment Variables**

**Problem:**

- Error: `Missing Supabase environment variables`
- `.env` and `.env.local` files are NOT deployed to Vercel (they're for local dev only)

**Solution:**
Add these to Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
```

✅ These are **public/safe** to expose - they're meant for browser code

---

### 2. **Frontend: Missing Contract Addresses**

**Problem:**

- Error: `t.readContract is not a function`
- Frontend was reading contract addresses from environment variables that didn't exist

**Solution:**
✅ **Hardcoded contract addresses directly in the code** (they're public on blockchain)

**Files Changed:**

- Created: `src/config/contracts.config.ts` - Central config for all contract addresses
- Updated: `src/hooks/useRespectGame.tsx` - Now imports from config

**Why this is safe:**

- Contract addresses are **public** on the blockchain
- Anyone can see them on BaseScan
- They can't be changed once deployed
- No security risk

---

### 3. **Webhook: Contract Addresses Not Set**

**Problem:**

- Webhook received events but processed **0 events**
- Was trying to read from `process.env.RESPECT_GAME_CORE_ADDRESS` which was empty
- Empty string never matched the actual contract address, so all events were skipped

**Solution:**
✅ **Hardcoded contract addresses in webhook**

**File Changed:**

- `api/webhook-respect-game.ts` - Lines 19-21

**Before:**

```typescript
const RESPECT_GAME_CORE_ADDRESS = (
  process.env.RESPECT_GAME_CORE_ADDRESS || ""
).toLowerCase();
```

**After:**

```typescript
const RESPECT_GAME_CORE_ADDRESS =
  "0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29".toLowerCase();
```

**Improved Logging:**

- Added detailed logs to show which addresses are being checked
- Will help debug issues faster in the future

---

## Contract Addresses (Base Sepolia Testnet)

```typescript
RESPECT_GAME_CORE: 0x8a8dbe61a0368855a455eec806bcfc40c9e95c29;
RESPECT_TOKEN: 0xef655aa8760d889bb0972903842d8929c80ba3fd;
RESPECT_GAME_GOVERNANCE: 0x354d6b039f6d463b706a63f18227eb34d4fc93aa;
EXECUTOR: 0xee9b38ee8ddf3ab5f63d1183e6c9db5640af2b18;
SIMPLE_STORAGE: 0x44ac2dae725b989df123243a21c9b52b224b4273;
```

View on BaseScan: https://sepolia.basescan.org/address/{address}

---

## Required Vercel Environment Variables

### ✅ Must Set (for production):

```
VITE_SUPABASE_URL - Your Supabase project URL
VITE_SUPABASE_ANON_KEY - Your Supabase anon/public key
SUPABASE_URL - Same as above (for webhooks)
SUPABASE_SERVICE_KEY - Your Supabase service_role key (for webhooks)
ALCHEMY_WEBHOOK_SIGNING_KEY - Your Alchemy webhook signing key
```

### ❌ No Longer Needed:

- ~~`VITE_RESPECT_GAME_CORE_ADDRESS`~~ - Now hardcoded
- ~~`VITE_RESPECT_TOKEN_ADDRESS`~~ - Now hardcoded
- ~~`VITE_RESPECT_GAME_GOVERNANCE_ADDRESS`~~ - Now hardcoded
- ~~`RESPECT_GAME_CORE_ADDRESS`~~ - Now hardcoded in webhook
- ~~`RESPECT_GAME_GOVERNANCE_ADDRESS`~~ - Now hardcoded in webhook

---

## Deploy Steps

1. **Commit and push changes:**

```bash
git add .
git commit -m "Fix: Hardcode contract addresses for production"
git push
```

2. **Set environment variables in Vercel:**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add the required variables listed above
- Select "Production", "Preview", and "Development" environments

3. **Redeploy:**

- Vercel will auto-deploy on push
- Or manually: Deployments → Click dots → Redeploy

4. **Test:**

- Create a profile on the frontend
- Check Vercel logs: Should see "✅ Processed 1 events successfully"
- Check Supabase: Member should appear in `members` table

---

## Debugging Webhook Issues

### Check Vercel Logs:

You should see:

```
🎣 Respect Game webhook received!
✅ Signature verified
📋 Processing 1 logs
🔍 Checking log from: 0x8a8dbe61a0368855a455eec806bcfc40c9e95c29
✅ Address matches! Processing...
📝 Processing event log from: 0x8a8dbe61a0368855a455eec806bcfc40c9e95c29
✅ Decoded event: MemberJoined
👤 Member joined: 0x... Name: ... Auto-approved: true
✅ Processed 1 events successfully
```

### If still processing 0 events:

- Check logs for "⏭️ Address doesn't match, skipping"
- Verify contract addresses match exactly (case insensitive)
- Check Alchemy webhook is pointing to correct contracts

---

## Why Contract Addresses Are Safe to Hardcode

1. **Public by design** - Anyone can see them on blockchain explorers
2. **Immutable** - Can't be changed once deployed
3. **Security in contracts** - Security is enforced by smart contract code, not address secrecy
4. **Easier to maintain** - No environment variables to manage
5. **Common practice** - Most dApps hardcode contract addresses

Examples: Uniswap, Aave, etc. all hardcode their contract addresses.

---

## Summary

**What was wrong:**

1. Frontend couldn't find Supabase config (env vars not in Vercel)
2. Frontend couldn't find contract addresses (env vars not set)
3. Webhook couldn't match contract addresses (env vars not set)

**What we fixed:**

1. ✅ Add Supabase env vars to Vercel (instructions above)
2. ✅ Hardcoded contract addresses in frontend
3. ✅ Hardcoded contract addresses in webhook
4. ✅ Added better logging for debugging

**Next steps:**

1. Commit and push
2. Set Supabase env vars in Vercel
3. Verify deployment works
4. Test profile creation end-to-end
