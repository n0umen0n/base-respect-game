# ✅ Webhook Active - Configuration Checklist

## Good News

Your webhook exists and is active in Alchemy! 🎉

## Now Verify These Exact Details

### 1. Check Webhook URL (CRITICAL)

**In Alchemy webhook settings, the URL should be EXACTLY:**

```
https://www.respectgame.app/api/webhook-respect-game
```

**Common mistakes that break webhooks:**

- ❌ `http://` instead of `https://`
- ❌ Missing `api/`: `https://www.respectgame.app/webhook-respect-game`
- ❌ Wrong endpoint name: `webhook-graphql` or `webhook`
- ❌ Trailing slash: `https://www.respectgame.app/api/webhook-respect-game/`
- ❌ Old Vercel URL: `*.vercel.app` instead of custom domain
- ❌ Typo in domain: `respectgame` vs `respect-game`

**ACTION:** Copy this URL and paste it exactly in Alchemy:

```
https://www.respectgame.app/api/webhook-respect-game
```

---

### 2. Check Network

**Your contracts are deployed on:**

- Network: **Base Sepolia**

**Alchemy webhook MUST be on the same network:**

- ✅ Base Sepolia (correct)
- ❌ Base Mainnet (wrong - different network)
- ❌ Ethereum Mainnet (wrong - different chain)
- ❌ Ethereum Sepolia (wrong - different chain)

**ACTION:** Verify webhook shows **"Base Sepolia"** as the network.

---

### 3. Check Webhook Type

**Should be:**

- ✅ GraphQL Webhook
- ✅ Address Activity Webhook

**NOT:**

- ❌ Custom Webhook (deprecated in some regions)

**ACTION:** Verify it's a GraphQL or Address Activity webhook.

---

### 4. Check Contract Addresses in Query

**Your deployed contracts (VERIFY THESE ARE CORRECT):**

```
RespectGameCore:  0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29
Governance:       0x354d6b039f6d463b706a63f18227eb34d4fc93aA
```

**In Alchemy GraphQL query, addresses MUST be lowercase:**

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

**ACTION:**

1. Copy the GraphQL query from Alchemy
2. Verify the addresses match (lowercase)
3. If wrong, update them

---

### 5. Test the Webhook

**In Alchemy Dashboard:**

1. Click on your webhook
2. Find **"Send Test Event"** or **"Test Webhook"** button
3. Click it

**Expected result:**

- ✅ **200 OK** response
- ✅ Shows in "Recent Deliveries" with 200 status

**If you get an error:**

- **401 Unauthorized:** Signing key mismatch (we can fix this)
- **404 Not Found:** URL is wrong
- **500 Server Error:** There's an issue (check Vercel logs)
- **Timeout:** Connection issue

**ACTION:** Click "Send Test Event" and tell me what happens.

---

### 6. Check Recent Deliveries

**In Alchemy Dashboard:**

1. Go to your webhook
2. Click **"Recent Deliveries"** or **"Deliveries"** tab
3. Look at the history

**What do you see?**

- ✅ **Recent entries with 200 status:** Working!
- ⚠️ **Old entries with 200, nothing recent:** No blockchain activity
- ❌ **Entries with 401/404/500:** Configuration issue
- ❌ **No entries at all:** Webhook never triggered or no activity

**ACTION:** Check what's in Recent Deliveries and let me know.

---

## Quick Test Right Now

Let's test if Alchemy can reach your endpoint:

**Step 1:** In a terminal, start watching logs:

```bash
cd "/Users/vlad/untitled folder/vladrespect"
vercel logs --follow
```

**Step 2:** In Alchemy dashboard, click **"Send Test Event"**

**Step 3:** Look at the logs

**You should see:**

```
🎣 Webhook received!
Method: POST
Headers: {...}
✅ Signature verified
📋 Processing GraphQL webhook...
```

**If you see nothing in logs:**

- Alchemy isn't reaching your endpoint
- URL in Alchemy is wrong

**If you see errors in logs:**

- Endpoint is reached but there's an issue
- We can fix it based on the error

---

## Alternative Test: Use Direct Vercel URL

To rule out custom domain issues, try updating the webhook to use the direct Vercel URL:

**In Alchemy, temporarily change webhook URL to:**

```
https://base-respect-game-cpnyjrzrd-vladislav-hramtsovs-projects.vercel.app/api/webhook-respect-game
```

Then test again. If this works but `www.respectgame.app` doesn't, there's a routing issue with the custom domain.

---

## Most Common Issues When Webhook is Active but Not Called

### Issue 1: URL Has Typo

**Check:** Webhook URL in Alchemy
**Fix:** Update to exact URL above

### Issue 2: No Blockchain Activity

**Check:** Are there any transactions on your contracts?
**Fix:** Trigger a test transaction:

```bash
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

### Issue 3: Wrong Contract Addresses

**Check:** Addresses in GraphQL query
**Fix:** Update to match your deployed contracts (lowercase)

### Issue 4: Signing Key Mismatch (but this causes 401, not "no calls")

**Check:** Recent Deliveries shows 401 errors
**Fix:** Update signing key in Vercel

---

## Action Items for You

Please check and report back:

1. **Webhook URL in Alchemy:** Is it exactly `https://www.respectgame.app/api/webhook-respect-game`?

2. **Network in Alchemy:** Does it say "Base Sepolia"?

3. **Contract addresses in GraphQL query:** Do they match your contracts (lowercase)?

4. **Test Result:** What happens when you click "Send Test Event"?

   - 200 OK?
   - Error code?
   - Nothing?

5. **Recent Deliveries:** Any entries? What status codes?

6. **Vercel Logs Test:**
   - Run `vercel logs --follow`
   - Click "Send Test Event" in Alchemy
   - Do logs show anything?

---

## Quick Diagnostic Commands

```bash
# Test your endpoint works
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Expected: {"success": true, ...}

# Watch for webhook calls
vercel logs --follow
# Then trigger test event in Alchemy
```

---

**Let me know what you find and I'll help you fix the exact issue! 🎯**
