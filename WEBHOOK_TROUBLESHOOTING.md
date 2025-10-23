# 🔧 Alchemy Webhook Troubleshooting Guide

## Step 1: Verify Endpoint is Reachable

Test that your webhook endpoint is accessible:

```bash
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Should return: `{"success": true, ...}`

## Step 2: Check Alchemy Webhook Dashboard

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Select your app
3. Go to **Notify** → **Webhooks**
4. Check **Recent Deliveries** for your webhook
5. Look for error codes:
   - **200**: Success ✅
   - **401**: Signature verification failed ❌
   - **404**: Endpoint not found ❌
   - **500**: Internal server error ❌
   - **Timeout**: Webhook took too long (>30s) ❌

## Step 3: Common Issues & Fixes

### Issue 1: Webhook Returns 404
**Cause**: Vercel routing issue or endpoint doesn't exist

**Fix**:
1. Verify `api/webhook-respect-game.ts` file exists
2. Check `vercel.json` doesn't block API routes
3. Redeploy: `vercel --prod`

### Issue 2: Webhook Returns 401 (Unauthorized)
**Cause**: Signature verification failing

**Fix**:
```bash
# Check if signing key is set
vercel env ls | grep ALCHEMY_WEBHOOK_SIGNING_KEY

# If missing or changed, update it:
vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY
# Paste your signing key from Alchemy dashboard
```

### Issue 3: Webhook Returns 500
**Cause**: Code error in webhook handler

**Fix**:
1. Check Vercel logs: `vercel logs <deployment-url>`
2. Look for stack traces
3. Common causes:
   - Missing environment variables
   - Database connection issues
   - Event parsing errors

### Issue 4: Webhook Times Out (30s+)
**Cause**: Webhook processing is too slow

**Fix**:
- Remove any `setTimeout` or long waits
- Process events in batches
- Return 200 quickly, process async

### Issue 5: No Events Received
**Cause**: Contract addresses don't match or no on-chain activity

**Fix**:
1. Verify contract addresses in Alchemy webhook config
2. Make sure addresses are **lowercase**
3. Trigger a test transaction
4. Check contract is on the right network (Base Sepolia vs Base Mainnet)

## Step 4: Test with Real Event

### Option A: Trigger Test Event from Alchemy
1. Go to Alchemy webhook dashboard
2. Click on your webhook
3. Click **"Send test event"**
4. Check response

### Option B: Trigger Real Transaction
```bash
# In blockchain directory
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

Watch Vercel logs for activity.

## Step 5: Check Recent Alchemy API Changes

Alchemy occasionally updates their webhook format. As of 2024-2025:

**Current Supported Formats:**
- ✅ GraphQL webhooks (recommended)
- ✅ Address Activity webhooks
- ⚠️ Custom webhooks (deprecated in some regions)

**If webhooks stopped working after Oct 2024:**
- Alchemy may have migrated to new webhook format
- Check [Alchemy Changelog](https://docs.alchemy.com/changelog)
- May need to recreate webhook

## Step 6: Verify Environment Variables

All required env vars on Vercel:

```bash
vercel env ls
```

Should show:
- ✅ `ALCHEMY_WEBHOOK_SIGNING_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`

## Step 7: Enable Debug Logging

Add extra logging to webhook handler:

```typescript
// At top of webhook-respect-game.ts handler function
console.log("🎣 WEBHOOK DEBUG START");
console.log("Headers:", JSON.stringify(req.headers, null, 2));
console.log("Body:", JSON.stringify(req.body, null, 2));
console.log("Signature:", req.headers["x-alchemy-signature"]);
console.log("🎣 WEBHOOK DEBUG END");
```

Deploy and check logs.

## Quick Fix Checklist

Run through these quickly:

- [ ] Test endpoint responds: `curl https://your-domain/api/test-webhook -X POST`
- [ ] Webhook URL in Alchemy is correct: `https://your-domain/api/webhook-respect-game`
- [ ] Signing key is set in Vercel: `vercel env ls | grep ALCHEMY`
- [ ] Contract addresses match (lowercase): Check Alchemy GraphQL query
- [ ] Recent delivery shows 200 status: Check Alchemy dashboard
- [ ] Recent deployment succeeded: `vercel ls`
- [ ] Network matches (Base Sepolia): Check both Alchemy app and contracts

## Still Not Working?

### Get Raw Webhook Data

1. Use a webhook debugging service temporarily:
   - [webhook.site](https://webhook.site)
   - [requestbin.com](https://requestbin.com)

2. Update Alchemy webhook to point to debugging URL
3. Trigger event
4. See exact payload Alchemy sends
5. Compare with what your code expects

### Check Alchemy Status

- [Alchemy Status Page](https://status.alchemy.com)
- Check for outages or degraded service

### Contact Support

If all else fails:
- Alchemy Support: [support.alchemy.com](https://support.alchemy.com)
- Include:
  - Webhook ID
  - Recent delivery logs
  - Error messages
  - Network (Base Sepolia)

## Emergency Workaround: Polling

If webhooks are completely broken, you can poll for events:

```typescript
// scripts/poll-events.ts
// Run every 30 seconds to check for new events
// Not recommended for production but works as backup
```

---

**Most Common Fix**: Recreate the webhook in Alchemy dashboard with the latest format.

