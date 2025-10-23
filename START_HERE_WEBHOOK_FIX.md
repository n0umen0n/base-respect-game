# 🎯 START HERE: Alchemy Webhook Fix

## What Was Wrong?

Your Alchemy webhooks stopped working. This is common and usually caused by:

1. ✅ **Alchemy updated their API format** (happens periodically)
2. ✅ **Signing key changed or expired**
3. ✅ **Webhook URL needed updating**

## What I Fixed

✅ **Updated webhook handler** (`api/webhook-respect-game.ts`)
- Added support for new Alchemy webhook formats
- Better error handling and logging
- More detailed debugging output

✅ **Created test endpoint** (`api/test-webhook.ts`)
- Quick way to verify endpoint is reachable

✅ **Created diagnostic tools**
- `fix-webhook.sh` - Automated fix script
- `WEBHOOK_TROUBLESHOOTING.md` - Detailed guide
- `WEBHOOK_FIX_SUMMARY.md` - Complete documentation

✅ **Deployed to production**
- Your updated code is live now
- Test endpoint is working ✅

---

## 🚀 What You Need To Do (5 Minutes)

### Step 1: Go to Alchemy Dashboard

[Open Alchemy Dashboard →](https://dashboard.alchemy.com)

1. Select your app
2. Go to **Notify** → **Webhooks**
3. Find your webhook for Base Respect Game

### Step 2: Check Recent Deliveries

Look at the **"Recent Deliveries"** tab:

- **If you see 200 status codes** → ✅ Your webhook is working! Nothing to do.
- **If you see 401/404/500 or no deliveries** → Continue to Step 3

### Step 3: Recreate Webhook (If Needed)

**If webhook is broken:**

1. Click **"Create New Webhook"**
   
2. Configure:
   - **Type:** GraphQL
   - **Network:** Base Sepolia
   - **Name:** Respect Game Events

3. **Webhook URL:**
   ```
   https://www.respectgame.app/api/webhook-respect-game
   ```

4. **GraphQL Query:**
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
   
   ⚠️ **Make sure addresses are YOUR deployed contract addresses!**

5. **Save** → Copy the **Signing Key** shown

### Step 4: Update Signing Key in Vercel

Open terminal and run:

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

### Step 5: Test It

**In Alchemy:**
1. Click "Send Test Event" on your webhook
2. Should see **200 OK** ✅

**In Terminal:**
```bash
vercel logs --follow
```

You should see:
```
🎣 Webhook received!
✅ Signature verified
📋 Processing GraphQL webhook with X logs
✅ Processed X events successfully
```

---

## ✅ Done!

Your webhooks should now be working. To verify:

1. Trigger a real blockchain event (e.g., join as member)
2. Check Alchemy Recent Deliveries (should be 200)
3. Check Vercel logs (should show processing)
4. Check Supabase (should have new data)
5. Check frontend (should display update)

---

## 🔧 If Still Not Working

### Quick Fixes

**401 Error (Unauthorized):**
- Signing key mismatch
- Re-do Step 4 above

**404 Error (Not Found):**
- Wrong webhook URL
- Should be: `https://www.respectgame.app/api/webhook-respect-game`

**500 Error (Server Error):**
- Check Vercel logs: `vercel logs --follow`
- Look for error message

**No Events:**
- Verify contract addresses in GraphQL query
- Make sure they're lowercase
- Trigger a test transaction

### Get More Help

Run the automated diagnostic:
```bash
./fix-webhook.sh
```

Or read detailed guides:
- `WEBHOOK_QUICK_FIX.md` - Quick reference
- `WEBHOOK_FIX_SUMMARY.md` - Complete guide
- `WEBHOOK_TROUBLESHOOTING.md` - Detailed troubleshooting

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Webhook code | ✅ Fixed & deployed |
| Test endpoint | ✅ Working |
| Production deployment | ✅ Live |
| Environment variables | ✅ Set (verify signing key) |
| Alchemy webhook | ⚠️ **YOU NEED TO UPDATE THIS** |

---

## 🎉 Summary

**What's working:**
- ✅ Your code is fixed and deployed
- ✅ Webhook endpoint is live and reachable
- ✅ Error handling is improved

**What you need to do:**
1. Update Alchemy webhook URL (if not already correct)
2. Get new signing key from Alchemy
3. Update signing key in Vercel
4. Test it

**Estimated time:** 5-10 minutes

---

**Questions? Check the detailed guides or let me know!** 🚀

