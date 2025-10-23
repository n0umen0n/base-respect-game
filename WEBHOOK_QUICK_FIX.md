# 🚀 Alchemy Webhook - Quick Fix

## ✅ What's Been Fixed

Your webhook code has been updated with:
- Better error handling and logging
- Support for multiple Alchemy webhook formats
- Debug endpoints for testing

**Deployment:** ✅ Complete (just deployed to production)

---

## 🎯 Next Steps (Do These Now)

### 1. Test Your Endpoint

```bash
curl -X POST https://www.respectgame.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected:** `{"success": true, "message": "Webhook endpoint is reachable!"}`

✅ **Status:** WORKING (tested and confirmed)

---

### 2. Update Alchemy Webhook

Go to: [Alchemy Dashboard → Your App → Notify → Webhooks](https://dashboard.alchemy.com)

#### Option A: Test Existing Webhook First

1. Click on your existing webhook
2. Check **"Recent Deliveries"** tab
3. Look at status codes:
   - **200**: Working! 🎉 (you're done)
   - **401**: Signing key issue (follow Option B)
   - **404/500**: Webhook broken (follow Option B)
   - **No deliveries**: No activity (trigger a test event)

#### Option B: Recreate Webhook

**If webhook is broken or returning errors:**

1. **Create New Webhook**
   - Click "Create Webhook"
   - Type: **GraphQL**
   - Network: **Base Sepolia** (or your network)

2. **Webhook URL:**
   ```
   https://www.respectgame.app/api/webhook-respect-game
   ```

3. **GraphQL Query:**
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
         account { address }
         topics
         data
         transaction { hash }
         transactionHash
       }
     }
   }
   ```
   
   ⚠️ **IMPORTANT:** Replace with YOUR contract addresses (lowercase!)

4. **Save and Copy Signing Key**
   - Alchemy shows a signing key after creation
   - **COPY IT!** You need it next

5. **Update Vercel Environment Variable:**
   ```bash
   vercel env rm ALCHEMY_WEBHOOK_SIGNING_KEY production
   vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY production
   # Paste the signing key when prompted
   
   # Redeploy
   vercel --prod
   ```

---

### 3. Test Webhook

**In Alchemy Dashboard:**
1. Click "Send Test Event" or "Test Webhook"
2. Should see **200 OK** response

**Check Logs:**
```bash
vercel logs --follow
```

Look for:
- "🎣 Webhook received!"
- "✅ Signature verified"
- "Processing GraphQL webhook..."

---

### 4. Trigger Real Event

```bash
# In blockchain directory
cd blockchain
npx hardhat run scripts/test-member-join.ts --network base-sepolia
```

Watch for:
1. Transaction confirmed on blockchain
2. Alchemy catches event (check Recent Deliveries)
3. Webhook processes event (check Vercel logs)
4. Database updated (check Supabase)

---

## 🔍 Quick Troubleshooting

### Webhook returns 401
**Fix:** Update signing key (see Option B, step 5)

### Webhook returns 404
**Fix:** Check URL is exactly: `https://www.respectgame.app/api/webhook-respect-game`

### Webhook returns 500
**Fix:** Check Vercel logs for specific error:
```bash
vercel logs --follow
```

### No events received
**Fix:** 
- Verify contract addresses in Alchemy GraphQL query
- Ensure addresses are lowercase
- Trigger a test transaction

---

## 📋 Your Contract Addresses

**Update these in Alchemy webhook:**

```
RespectGameCore: 0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29
Governance:      0x354d6b039f6d463b706a63f18227eb34d4fc93aA
```

(Make sure they're lowercase in GraphQL query)

---

## ✨ Expected Behavior

When working correctly:

1. ✅ User calls contract function
2. ✅ Event emitted on blockchain
3. ✅ Alchemy catches event
4. ✅ POST request to your webhook
5. ✅ Signature verified
6. ✅ Event decoded and processed
7. ✅ Database updated
8. ✅ Frontend shows new data

---

## 📚 More Help

- **Detailed guide:** `WEBHOOK_FIX_SUMMARY.md`
- **Troubleshooting:** `WEBHOOK_TROUBLESHOOTING.md`
- **Auto-fix script:** `./fix-webhook.sh`

---

## 🆘 Still Not Working?

1. Run the auto-fix script:
   ```bash
   ./fix-webhook.sh
   ```

2. Check Alchemy status: [status.alchemy.com](https://status.alchemy.com)

3. Use webhook debugger:
   - Point webhook to [webhook.site](https://webhook.site)
   - See exact payload Alchemy sends

4. Contact me with:
   - Alchemy Recent Delivery logs (screenshot)
   - Vercel logs output
   - Error messages

---

**Your webhook endpoint is live and ready! 🎉**

Just update the Alchemy webhook URL and signing key, and you're good to go!

