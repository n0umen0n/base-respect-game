# 🔔 Alchemy Webhook Setup Guide

## Prerequisites

Before setting up the webhook, you need:

- ✅ Deployed contract addresses (RespectGameCore & Governance)
- ✅ Vercel deployment URL (or local tunnel for testing)
- ✅ Alchemy account

## Step-by-Step Setup

### 1. Create Alchemy App

1. Go to [https://alchemy.com](https://alchemy.com)
2. Sign in or create account
3. Click **"Create App"**
4. Configure:
   - **Chain**: Base Sepolia (for testnet)
   - **Network**: Base Sepolia Testnet
   - **Name**: Respect Game Webhook
5. Click **"Create App"**

### 2. Enable Enhanced APIs

1. In your app dashboard
2. Go to **"APIs"** tab
3. Enable **"Notify API"** (webhooks)

### 3. Create GraphQL Webhook

1. In dashboard, go to **"Notify"** → **"GraphQL"**
2. Click **"Create New Webhook"**
3. Choose **"GraphQL Webhook"**

### 4. Configure GraphQL Query

Paste this GraphQL query (replace with your contract addresses):

```graphql
{
  block {
    logs(
      filter: {
        addresses: [
          "0xYOUR_RESPECT_GAME_CORE_ADDRESS"
          "0xYOUR_GOVERNANCE_ADDRESS"
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

**Important**:

- Replace `0xYOUR_RESPECT_GAME_CORE_ADDRESS` with your actual RespectGameCore address
- Replace `0xYOUR_GOVERNANCE_ADDRESS` with your actual Governance address
- Addresses should be lowercase

### 5. Set Webhook URL

**For Production:**

```
https://your-app.vercel.app/api/webhook-respect-game
```

**For Local Testing (using ngrok):**

```bash
# In terminal, run ngrok
ngrok http 3000

# Use the ngrok URL
https://your-random-id.ngrok.io/api/webhook-respect-game
```

### 6. Save Signing Key

1. After creating webhook, Alchemy shows a **Signing Key**
2. **COPY THIS KEY** - you'll need it!
3. Add to your environment variables:

**Vercel:**

```
ALCHEMY_WEBHOOK_SIGNING_KEY=your-signing-key-here
```

**Local (.env):**

```
ALCHEMY_WEBHOOK_SIGNING_KEY=your-signing-key-here
```

### 7. Test the Webhook

1. In Alchemy dashboard, find your webhook
2. Click **"Test Webhook"**
3. Or trigger a real contract event (e.g., call `becomeMember`)
4. Check Vercel logs to see if event was received

## Webhook Endpoint

Your webhook handler is at: `api/webhook-respect-game.ts`

It handles:

- ✅ Signature verification
- ✅ Event decoding (using ethers ABI)
- ✅ Supabase updates for all events

## Environment Variables Needed

Make sure these are set in Vercel:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Alchemy
ALCHEMY_WEBHOOK_SIGNING_KEY=your-webhook-signing-key

# Contracts (lowercase!)
RESPECT_GAME_CORE_ADDRESS=0x...
RESPECT_GAME_GOVERNANCE_ADDRESS=0x...
```

## Verify It's Working

### Check Webhook Logs

1. Go to Alchemy dashboard → Your webhook
2. Check **"Recent Deliveries"**
3. Should show 200 status codes

### Check Vercel Logs

```bash
vercel logs --follow
```

Look for:

- ✅ "Webhook received!"
- ✅ "Signature verified"
- ✅ "Decoded event: MemberJoined" (or other events)
- ✅ "User updated successfully"

### Check Supabase

1. Go to Supabase → Table Editor
2. Check `members` table
3. Should see new rows when events fire

## Troubleshooting

### Webhook Shows 401 Error

**Problem**: Invalid signature  
**Solution**: Check `ALCHEMY_WEBHOOK_SIGNING_KEY` matches

### Webhook Shows 500 Error

**Problem**: Code error  
**Solution**: Check Vercel logs for stack trace

### No Events Received

**Problem**: Wrong contract addresses  
**Solution**:

1. Verify addresses in GraphQL query are correct
2. Make sure they're lowercase
3. Check contract is deployed and has activity

### Events Not Decoded

**Problem**: Wrong event signature  
**Solution**: Event signatures in `webhook-respect-game.ts` match your contracts

## Alternative: Address Activity Webhook

If GraphQL doesn't work, try Address Activity:

1. Create **"Address Activity"** webhook instead
2. Add both contract addresses
3. Select **"All Activity"**
4. The webhook handler supports both types!

## Quick Reference

### Your Contracts (Update These!)

```
RespectGameCore: 0x...
Governance: 0x...
```

### Your Webhook URL

```
Production: https://your-app.vercel.app/api/webhook-respect-game
Local: https://your-ngrok-id.ngrok.io/api/webhook-respect-game
```

### Test Command

After setup, test by calling:

```bash
# In blockchain directory
npx hardhat run scripts/test-webhook.ts --network base-sepolia
```

## Events That Trigger Webhooks

Your webhook handles these events:

**Core Contract:**

- MemberJoined
- ContributionSubmitted
- RankingSubmitted
- RespectDistributed
- StageChanged
- GroupAssigned
- MemberApproved
- MemberBanned

**Governance Contract:**

- ProposalCreated
- ProposalVoted
- ProposalExecuted

Each event is properly decoded with ethers and saved to Supabase! ✨

---

**Need Help?** Check Vercel logs and Alchemy delivery logs for debugging.
