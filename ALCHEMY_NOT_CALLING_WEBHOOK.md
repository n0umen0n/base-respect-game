# 🚨 Alchemy Not Calling Webhook - Diagnostic Guide

## Problem

Your webhook endpoint is working and accessible, but **Alchemy is not sending any requests to it.**

This means:

- ✅ Your code is fine
- ✅ Your domain is accessible
- ❌ Alchemy webhook is not configured correctly or is not active

---

## Quick Diagnosis Checklist

### 1. Check Webhook Exists and is Active

Go to [Alchemy Dashboard](https://dashboard.alchemy.com):

1. Select your app (should be on Base Sepolia or Base Mainnet)
2. Go to **Notify** → **Webhooks**
3. Check if you have a webhook configured

**Common Issues:**

- ❌ No webhook exists at all
- ❌ Webhook is paused/disabled
- ❌ Webhook is for wrong network (Base Mainnet vs Sepolia)
- ❌ Webhook URL is wrong
- ❌ Webhook was deleted accidentally

---

## Step-by-Step Fix

### Step 1: Verify Webhook URL in Alchemy

**In Alchemy Dashboard:**

1. Go to Notify → Webhooks
2. Click on your webhook (if it exists)
3. Check the **Webhook URL** field

**It should be EXACTLY:**

```
https://www.respectgame.app/api/webhook-respect-game
```

**Common mistakes:**

- ❌ `http://` instead of `https://`
- ❌ Missing `/api/` in path
- ❌ Wrong endpoint name
- ❌ Trailing slash: `/api/webhook-respect-game/`
- ❌ Old Vercel URL instead of custom domain

**If URL is wrong:** Edit webhook and fix it, or create a new one.

---

### Step 2: Check Webhook Type and Network

**Your webhook should be:**

- **Type:** GraphQL (or Address Activity)
- **Network:** Base Sepolia (or Base Mainnet if you're on mainnet)
- **Status:** Active/Enabled (not paused)

**If wrong network:**

- You won't receive events because your contracts are on a different network
- Create a new webhook on the correct network

---

### Step 3: Verify Contract Addresses

**In your GraphQL webhook, verify the addresses match your deployed contracts:**

Your contracts:

```
RespectGameCore:  0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29
Governance:       0x354d6b039f6d463b706a63f18227eb34d4fc93aA
```

**GraphQL query should have (LOWERCASE):**

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

**If addresses don't match:** Edit webhook or create new one with correct addresses.

---

### Step 4: Test Webhook from Alchemy

**In Alchemy Dashboard:**

1. Go to your webhook
2. Click **"Send Test Event"** or **"Test Webhook"**
3. Watch what happens

**Expected:** Should show "200 OK" response

**If it fails:**

- **404 Error:** URL is wrong
- **401 Error:** Signing key issue (but at least Alchemy is reaching your endpoint)
- **Timeout:** Your endpoint might be blocked or slow
- **Connection refused:** DNS or routing issue

---

### Step 5: Check Recent Deliveries

**In Alchemy Dashboard:**

1. Go to your webhook
2. Click **"Recent Deliveries"** tab
3. Look at the history

**What to look for:**

- **No deliveries at all:** Webhook isn't configured to listen to events, or no events are happening
- **Old deliveries with errors:** Webhook was working before but broke
- **Recent 200s:** Webhook is actually working!

---

### Step 6: Trigger a Real Event

Sometimes Alchemy test events don't work but real events do. Try triggering a real blockchain event:

```bash
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

Then:

1. Check Alchemy Recent Deliveries (refresh the page)
2. Check Vercel logs: `vercel logs --follow`
3. Check if anything happened

---

## Alternative: Try Vercel Direct URL

Sometimes custom domains have issues. Try using the direct Vercel URL instead:

**Get your current Vercel URL:**

```bash
vercel ls | head -5
```

Should show something like:

```
base-respect-game-cpnyjrzrd-vladislav-hramtsovs-projects.vercel.app
```

**Update Alchemy webhook to use this URL:**

```
https://base-respect-game-cpnyjrzrd-vladislav-hramtsovs-projects.vercel.app/api/webhook-respect-game
```

This bypasses any custom domain routing issues.

---

## Debugging with Webhook.site

If you still can't figure out if Alchemy is sending requests:

1. Go to [webhook.site](https://webhook.site)
2. Copy the unique URL it gives you
3. Update your Alchemy webhook to point to that URL temporarily
4. Trigger a test event in Alchemy
5. See if webhook.site receives anything

**If webhook.site receives the request:**

- ✅ Alchemy is working
- ❌ Problem is with your Vercel endpoint

**If webhook.site does NOT receive anything:**

- ❌ Problem is with Alchemy configuration
- Check webhook exists, is active, and has correct addresses

---

## Most Common Causes

Based on "webhook not getting called at all":

### 1. ❌ No Webhook Configured

**Fix:** Create a webhook in Alchemy dashboard

### 2. ❌ Webhook URL is Wrong

**Fix:** Double-check URL matches exactly:

```
https://www.respectgame.app/api/webhook-respect-game
```

### 3. ❌ Wrong Network

**Fix:** Webhook must be on same network as your contracts (Base Sepolia)

### 4. ❌ Wrong Contract Addresses

**Fix:** Update GraphQL query with your actual contract addresses

### 5. ❌ Webhook is Paused

**Fix:** Enable/resume webhook in Alchemy dashboard

### 6. ❌ No Blockchain Activity

**Fix:** Trigger a test event to verify webhook works

---

## Quick Test Script

Run this to test end-to-end:

```bash
# 1. Check your endpoint is accessible
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Should return: {"success": true, ...}

# 2. Watch logs
vercel logs --follow

# 3. In another terminal, trigger an event
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia

# 4. Watch logs for webhook activity
```

---

## Vercel Production URL

Your latest deployment URLs:

```bash
# Get current production URL
vercel ls | grep "Production"
```

You can use this URL directly in Alchemy if custom domain isn't working.

---

## Summary

Your webhook code is working. The issue is **Alchemy configuration**.

**Action Items:**

1. ✅ Verify webhook exists in Alchemy dashboard
2. ✅ Verify URL is: `https://www.respectgame.app/api/webhook-respect-game`
3. ✅ Verify network is correct (Base Sepolia)
4. ✅ Verify contract addresses are correct
5. ✅ Test webhook with Alchemy's test button
6. ✅ Check Recent Deliveries for any activity

**If still stuck:**

- Try direct Vercel URL instead of custom domain
- Use webhook.site to confirm Alchemy is sending requests
- Share screenshot of your Alchemy webhook configuration

---

**Your webhook endpoint is live and working. We just need to configure Alchemy to call it! 🎯**
