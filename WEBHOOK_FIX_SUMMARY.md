# 🔧 Alchemy Webhook Fix - Summary

## What I Fixed

### 1. Enhanced Webhook Handler (`api/webhook-respect-game.ts`)

**Changes:**
- ✅ Added comprehensive debug logging to see exactly what Alchemy is sending
- ✅ Added better error handling for missing signature headers
- ✅ Added support for new webhook format (direct `logs` array)
- ✅ Added validation for environment variables
- ✅ Better error messages to help diagnose issues

**Why:** Alchemy sometimes updates their webhook format. Your handler now supports:
- GraphQL webhooks (original format)
- Address Activity webhooks
- New direct logs format (2024-2025 format)

### 2. Created Test Endpoint (`api/test-webhook.ts`)

**Purpose:** Quickly verify your webhook endpoint is reachable and functioning.

**Test it:**
```bash
curl -X POST https://your-domain.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook endpoint is reachable!",
  "timestamp": "2025-10-22T...",
  "method": "POST",
  "hasBody": true
}
```

### 3. Created Fix Script (`fix-webhook.sh`)

**What it does:**
- ✅ Checks Vercel CLI is installed
- ✅ Verifies all environment variables are set
- ✅ Checks webhook files exist
- ✅ Deploys to Vercel production
- ✅ Tests the webhook endpoint
- ✅ Provides next steps for Alchemy setup

**Run it:**
```bash
./fix-webhook.sh
```

### 4. Created Troubleshooting Guide (`WEBHOOK_TROUBLESHOOTING.md`)

Comprehensive guide for diagnosing webhook issues with step-by-step fixes.

---

## 🚀 Quick Fix Steps

### Step 1: Deploy Updated Code

```bash
cd "/Users/vlad/untitled folder/vladrespect"
vercel --prod
```

### Step 2: Test Webhook Endpoint

```bash
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Should return `{"success": true, ...}`

### Step 3: Check Alchemy Dashboard

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Select your app
3. Go to **Notify** → **Webhooks**
4. Find your existing webhook
5. Check **"Recent Deliveries"** tab

**Look for:**
- Status codes (200 = good, 401/404/500 = bad)
- Error messages
- Timestamp of last delivery

### Step 4: Update Alchemy Webhook (if needed)

**Option A: Test Existing Webhook**
1. In Alchemy dashboard, click on your webhook
2. Click **"Test Webhook"** or **"Send Test Payload"**
3. Check if it reaches your endpoint (watch Vercel logs)

**Option B: Recreate Webhook**

If test fails, Alchemy may have deprecated the old webhook format. Recreate it:

1. **Delete** old webhook (or keep for reference)

2. **Create New Webhook:**
   - Click "Create Webhook"
   - Choose **"GraphQL"**
   - Network: **Base Sepolia** (or Base Mainnet if on mainnet)

3. **Set Webhook URL:**
   ```
   https://www.respectgame.app/api/webhook-respect-game
   ```

4. **Set GraphQL Query:**
   ```graphql
   {
     block {
       logs(
         filter: {
           addresses: [
             "0x8a8dbe61a0368855a455eec806bcfc40c9e95c29"
             "0x354d6b039f6d463b706a63f18227eb34d4fc93aa"
           ]
         }
       ) {
         account {
           address
         }
         topics
         data
         transaction {
           hash
         }
         transactionHash
       }
     }
   }
   ```
   
   **Important:** Verify these addresses match your deployed contracts!

5. **Save Webhook**
   - Alchemy will show a **Signing Key**
   - **COPY THIS KEY!**

6. **Update Vercel Environment Variable:**
   ```bash
   vercel env rm ALCHEMY_WEBHOOK_SIGNING_KEY production
   vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY production
   # Paste the new signing key when prompted
   ```

7. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Step 5: Test End-to-End

**Option A: Use Alchemy Test**
1. In webhook dashboard, click **"Test Webhook"**
2. Watch Vercel logs: `vercel logs --follow`
3. Should see: "🎣 Webhook received!" and "✅ Signature verified"

**Option B: Trigger Real Event**
```bash
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

Watch for:
- Transaction on blockchain
- Webhook delivery in Alchemy (Recent Deliveries tab)
- Processing logs in Vercel
- Database update in Supabase

### Step 6: Monitor Logs

```bash
# Watch real-time logs
vercel logs --follow

# Or check logs for specific deployment
vercel ls  # get deployment URL
vercel logs <deployment-url>
```

**Look for:**
- ✅ "🎣 Webhook received!"
- ✅ "✅ Signature verified"
- ✅ "Processing GraphQL webhook with X logs"
- ✅ "✅ Decoded event: MemberJoined" (or other events)
- ✅ "✅ Processed X events successfully"

**Red flags:**
- ❌ "Invalid signature" → Signing key mismatch
- ❌ "Unknown webhook format" → Alchemy changed format again
- ❌ "Missing signature" → Alchemy not sending signature header
- ❌ Database errors → Check Supabase connection

---

## 🔍 Common Issues & Solutions

### Issue 1: Webhook Returns 401 (Unauthorized)

**Cause:** Signing key mismatch

**Fix:**
```bash
# Get current key from Alchemy dashboard
# Update in Vercel
vercel env rm ALCHEMY_WEBHOOK_SIGNING_KEY production
vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY production
vercel --prod
```

### Issue 2: Webhook Returns 404 (Not Found)

**Cause:** Endpoint URL wrong or routing issue

**Fix:**
1. Verify URL in Alchemy: `https://www.respectgame.app/api/webhook-respect-game`
2. Check vercel.json doesn't block `/api/*`
3. Verify file exists: `api/webhook-respect-game.ts`
4. Redeploy: `vercel --prod`

### Issue 3: "Unknown webhook format" Error

**Cause:** Alchemy changed their payload structure

**Fix:**
1. Check logs for payload structure
2. Update webhook handler to support new format
3. Or switch to Address Activity webhook instead of GraphQL

### Issue 4: No Events Received

**Cause:** No blockchain activity or wrong contract addresses

**Fix:**
1. Verify contract addresses in Alchemy GraphQL query
2. Ensure addresses are lowercase
3. Check correct network (Base Sepolia vs Mainnet)
4. Trigger a test transaction

### Issue 5: Events Received But Not Processed

**Cause:** Event parsing error or database issue

**Fix:**
1. Check Vercel logs for specific error
2. Verify Supabase is accessible
3. Check event signatures match contract events
4. Verify database schema matches

---

## 📊 Verification Checklist

Run through this checklist:

- [ ] Test endpoint responds: `curl https://www.respectgame.app/api/test-webhook -X POST`
- [ ] Alchemy webhook URL is: `https://www.respectgame.app/api/webhook-respect-game`
- [ ] Signing key is set: `vercel env ls | grep ALCHEMY`
- [ ] Contract addresses match (lowercase)
- [ ] Recent Alchemy delivery shows 200 status
- [ ] Vercel logs show webhook received
- [ ] Database updates after event
- [ ] Frontend shows new data

---

## 🆘 Still Not Working?

### Get More Debug Info

1. **Check Alchemy Recent Deliveries:**
   - Status code
   - Response body
   - Error message

2. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```
   - Look for "🎣 Webhook received!"
   - Look for error stack traces

3. **Use Webhook Debugger:**
   - Temporarily point webhook to [webhook.site](https://webhook.site)
   - See exact payload Alchemy sends
   - Compare with what your code expects

4. **Check Alchemy Status:**
   - [status.alchemy.com](https://status.alchemy.com)
   - Look for outages or degraded service

### Need More Help?

1. Check `WEBHOOK_TROUBLESHOOTING.md` for detailed guide
2. Review Alchemy docs: [docs.alchemy.com](https://docs.alchemy.com/reference/notify-api)
3. Contact Alchemy support with:
   - Webhook ID
   - Recent delivery logs
   - Error messages
   - Network (Base Sepolia)

---

## 🎯 Expected Behavior After Fix

When everything is working:

1. **User Action:** Someone calls a contract function (e.g., `becomeMember()`)

2. **Blockchain:** Transaction confirmed, event emitted

3. **Alchemy:** Catches event, sends POST to your webhook

4. **Your Webhook:**
   - Receives POST request
   - Verifies signature ✅
   - Parses event ✅
   - Updates database ✅
   - Returns 200 OK ✅

5. **Alchemy Dashboard:** Shows 200 status in Recent Deliveries ✅

6. **Vercel Logs:** Shows successful processing ✅

7. **Database:** Has new data ✅

8. **Frontend:** Displays updated data ✅

---

## 📝 Summary of Changes

**Files Modified:**
- `api/webhook-respect-game.ts` - Enhanced error handling and logging
- `vercel.json` - (no changes needed, already correct)

**Files Created:**
- `api/test-webhook.ts` - Test endpoint
- `fix-webhook.sh` - Automated fix script
- `WEBHOOK_TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `WEBHOOK_FIX_SUMMARY.md` - This file

**Next Action:**
```bash
# Run the fix script
./fix-webhook.sh

# Or manually deploy
vercel --prod
```

Then test and verify in Alchemy dashboard! 🚀

