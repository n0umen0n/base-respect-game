# 🎯 Fix Alchemy Webhook NOW - Action Plan

## The Problem

Your webhook endpoint is **working fine**, but Alchemy is **not calling it**.

This is an **Alchemy configuration issue**, not a code issue.

---

## Your Working Endpoints

✅ **Test endpoint:** https://www.respectgame.app/api/test-webhook (WORKS)
✅ **Main endpoint:** https://www.respectgame.app/api/webhook-respect-game (READY)

**Latest Vercel deployment:**

```
https://base-respect-game-cpnyjrzrd-vladislav-hramtsovs-projects.vercel.app
```

---

## Action Steps (Do This Now)

### Option 1: Check Current Alchemy Webhook

**Go to:** [https://dashboard.alchemy.com](https://dashboard.alchemy.com)

1. **Select your app** (should be on Base network)

2. **Go to: Notify → Webhooks**

3. **Do you see a webhook?**

   - **YES** → Go to Step 4
   - **NO** → Jump to Option 2 (Create New Webhook)

4. **Click on the webhook** and verify:

   - [ ] Status: **Active** (not paused)
   - [ ] Network: **Base Sepolia** (or your network)
   - [ ] URL: `https://www.respectgame.app/api/webhook-respect-game`
   - [ ] Type: **GraphQL** or **Address Activity**

5. **If URL is wrong:** Click Edit and fix it

6. **Test it:** Click "Send Test Event"
   - **200 OK?** ✅ You're fixed!
   - **Error?** → Try Option 2

---

### Option 2: Create New Webhook (Recommended)

Since your webhook isn't being called, let's create a fresh one:

**1. In Alchemy Dashboard:**

- Click **"Create Webhook"**
- Select **"GraphQL"**

**2. Configure Webhook:**

| Field           | Value                                                  |
| --------------- | ------------------------------------------------------ |
| **Name**        | Respect Game Events                                    |
| **Network**     | Base Sepolia (or Base Mainnet)                         |
| **Webhook URL** | `https://www.respectgame.app/api/webhook-respect-game` |

**3. GraphQL Query:**

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

⚠️ **IMPORTANT:** Verify these are YOUR contract addresses!

**4. Save Webhook**

- Alchemy will show a **Signing Key**
- **COPY IT!** You need this

**5. Update Vercel Environment:**

```bash
cd "/Users/vlad/untitled folder/vladrespect"

# Remove old key
vercel env rm ALCHEMY_WEBHOOK_SIGNING_KEY production

# Add new key
vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY production
# Paste the signing key when prompted

# Redeploy
vercel --prod
```

**6. Test in Alchemy:**

- Click "Send Test Event"
- Should see **200 OK** ✅

---

### Option 3: Try Direct Vercel URL

If custom domain has routing issues, use the direct Vercel URL:

**In Alchemy, change webhook URL to:**

```
https://base-respect-game-cpnyjrzrd-vladislav-hramtsovs-projects.vercel.app/api/webhook-respect-game
```

This bypasses any custom domain issues.

---

## Verify It's Working

### Test 1: Alchemy Test Button

1. In Alchemy webhook dashboard
2. Click "Send Test Event"
3. Should see 200 OK

### Test 2: Check Logs

```bash
vercel logs --follow
```

You should see:

```
🎣 Webhook received!
✅ Signature verified
📋 Processing GraphQL webhook...
```

### Test 3: Real Transaction

```bash
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

Then check:

1. Alchemy "Recent Deliveries" tab
2. Vercel logs
3. Supabase database

---

## Still Not Working?

### Use Webhook Debugger

1. **Go to:** [https://webhook.site](https://webhook.site)
2. **Copy** the unique URL it gives you
3. **In Alchemy:** Temporarily change webhook URL to that webhook.site URL
4. **Click** "Send Test Event"
5. **Check** if webhook.site receives anything

**Result:**

- ✅ **Receives request:** Alchemy is working, problem is with your endpoint routing
  - Try direct Vercel URL (Option 3)
- ❌ **No request:** Problem is with Alchemy configuration
  - Verify network, contract addresses, webhook is active

---

## Most Likely Issues

Based on "not getting called at all":

### 1. ❌ Webhook URL is Wrong in Alchemy

**Fix:** Update to: `https://www.respectgame.app/api/webhook-respect-game`

### 2. ❌ Webhook is on Wrong Network

**Fix:** Must be on Base Sepolia (where your contracts are)

### 3. ❌ Webhook is Paused/Disabled

**Fix:** Enable it in Alchemy dashboard

### 4. ❌ Contract Addresses Don't Match

**Fix:** Verify addresses in GraphQL query match your deployed contracts

### 5. ❌ No Webhook Exists

**Fix:** Create new webhook (Option 2)

---

## Your Contract Addresses (Verify These!)

```
RespectGameCore:  0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29
Governance:       0x354d6b039f6d463b706a63f18227eb34d4fc93aA
Network:          Base Sepolia
```

**In GraphQL query, these MUST be lowercase:**

```
0x8a8dbe61a0368855a455eec806bcfc40c9e95c29
0x354d6b039f6d463b706a63f18227eb34d4fc93aa
```

---

## Quick Diagnostic

Run this to confirm your endpoint works:

```bash
# Test endpoint
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: {"success": true, "message": "Webhook endpoint is reachable!", ...}
```

If this works (and it does), the problem is 100% in Alchemy configuration.

---

## Next Steps

1. **Right now:** Go to Alchemy dashboard
2. **Check:** Does webhook exist and have correct URL?
3. **Fix:** Update URL or create new webhook (Option 2)
4. **Test:** Click "Send Test Event" in Alchemy
5. **Verify:** Check logs with `vercel logs --follow`

**Your endpoint is ready. Just need to point Alchemy to it correctly! 🎯**

---

## Need Screenshots?

If you want me to help diagnose, share screenshots of:

1. Alchemy webhook configuration page
2. Alchemy "Recent Deliveries" tab
3. Your contract addresses from blockchain deployment

The fix is probably just updating the webhook URL or creating a new webhook. Should take 2 minutes! 🚀
