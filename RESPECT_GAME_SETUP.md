# Respect Game - Complete Setup Guide

This guide will help you set up the entire Respect Game application from scratch.

## Overview

The Respect Game is a decentralized reputation system built on Base that includes:

- Profile creation and member management
- Periodic contribution submissions
- Peer ranking system
- Governance through proposals
- RESPECT token rewards

## Architecture

The system consists of:

1. **Smart Contracts** (Solidity) - On-chain logic
2. **Frontend** (React + TypeScript) - User interface
3. **Database** (Supabase) - Off-chain data storage
4. **Webhooks** (Vercel Functions) - Contract event processing

## Prerequisites

- Node.js 18+
- npm or yarn
- A Base wallet with testnet ETH
- Alchemy account
- Supabase account
- Pimlico account (for smart wallet/gas sponsorship)
- Privy account (for authentication)

## Step 1: Clone and Install

```bash
cd vladrespect
npm install
cd blockchain
npm install
```

## Step 2: Set Up Smart Contracts

### 2.1 Deploy Contracts

```bash
cd blockchain

# Set up your .env file
cp .env.example .env
# Add your deployer private key and RPC URL

# Deploy to Base Sepolia testnet
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia
```

Save the deployed contract addresses:

- RespectGameCore
- RespectToken
- RespectGameGovernance

### 2.2 Verify Contracts (Optional)

```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Step 3: Set Up Supabase Database

### 3.1 Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for it to initialize

### 3.2 Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/respect-game-schema.sql`
3. Run the SQL to create all tables, views, and policies

### 3.3 Get Supabase Credentials

From Project Settings > API:

- Project URL (`VITE_SUPABASE_URL`)
- Anon/Public key (`VITE_SUPABASE_ANON_KEY`)
- Service Role key (`SUPABASE_SERVICE_KEY`) - Keep this secret!

## Step 4: Set Up Alchemy Webhooks

### 4.1 Create Alchemy App

1. Go to https://alchemy.com
2. Create a new app on Base Sepolia
3. Enable Enhanced APIs

### 4.2 Create GraphQL Webhook

1. In Alchemy dashboard, go to Notify
2. Create new GraphQL webhook
3. Set up the GraphQL query to watch for contract events:

```graphql
{
  block {
    logs(
      filter: {
        addresses: [
          "<YOUR_RESPECT_GAME_CORE_ADDRESS>"
          "<YOUR_GOVERNANCE_ADDRESS>"
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
    }
  }
}
```

4. Set webhook URL: `https://your-vercel-app.vercel.app/api/webhook-respect-game`
5. Save the signing key

## Step 5: Configure Environment Variables

### 5.1 Frontend (.env.local)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RESPECT_GAME_CORE_ADDRESS=0x...
VITE_RESPECT_TOKEN_ADDRESS=0x...
VITE_RESPECT_GAME_GOVERNANCE_ADDRESS=0x...
```

### 5.2 Backend/Webhooks (Vercel Environment Variables)

In your Vercel project settings, add:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALCHEMY_WEBHOOK_SIGNING_KEY=your-signing-key
RESPECT_GAME_CORE_ADDRESS=0x...
RESPECT_GAME_GOVERNANCE_ADDRESS=0x...
```

## Step 6: Configure Smart Wallet (Pimlico)

### 6.1 Get Pimlico API Key

1. Go to https://pimlico.io
2. Sign up and create a project
3. Get your API key

### 6.2 Update Configuration

Edit `src/config/smartWallet.config.ts`:

```typescript
export const SMART_WALLET_CONFIG = {
  PIMLICO_API_KEY: "your-pimlico-api-key",
  CHAIN_ID: 84532, // Base Sepolia
  // ... rest of config
};
```

## Step 7: Update Privy Configuration

In `src/main.jsx`, update the Privy App ID if you have your own:

```jsx
<PrivyProvider
  appId="your-privy-app-id"
  // ... rest of config
>
```

## Step 8: Deploy to Vercel

### 8.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 8.2 Deploy

```bash
vercel

# For production
vercel --prod
```

### 8.3 Add Environment Variables

In Vercel dashboard, add all environment variables from Step 5.2

## Step 9: Test the Application

### 9.1 Local Testing

```bash
npm run dev
```

Visit http://localhost:5173

### 9.2 Test Flow

1. **Login**: Click "Log in to play" with Privy
2. **Create Profile**: Fill in profile information
3. **Wait for Approval**: First N members auto-approved
4. **Submit Contribution**: During submission phase
5. **Rank Peers**: During ranking phase
6. **View Results**: Check profile for RESPECT earned

## Step 10: Production Checklist

- [ ] Contracts deployed to mainnet
- [ ] Contracts verified on BaseScan
- [ ] Supabase production database set up
- [ ] All environment variables updated for mainnet
- [ ] Alchemy webhooks pointing to production
- [ ] Frontend deployed to production
- [ ] Test full flow on mainnet
- [ ] Monitor contract events
- [ ] Set up error monitoring (e.g., Sentry)

## Key Files Reference

### Smart Contracts

- `blockchain/contracts/RespectGameCore.sol` - Main game logic
- `blockchain/contracts/RespectGameGovernance.sol` - Governance system
- `blockchain/contracts/RespectToken.sol` - ERC20 token

### Frontend Components

- `src/components/ProfileCreation.tsx` - Onboarding
- `src/components/ContributionSubmission.tsx` - Submit contributions
- `src/components/RankingSubmission.tsx` - Rank peers
- `src/components/ProfilePage.tsx` - User profile
- `src/components/ProposalsPage.tsx` - Governance
- `src/components/RespectGameContainer.tsx` - Main app logic

### Backend

- `api/webhook-respect-game.ts` - Process contract events
- `supabase/respect-game-schema.sql` - Database schema

### Hooks & Utils

- `src/hooks/useRespectGame.tsx` - Contract interactions
- `src/hooks/useSmartWallet.tsx` - Smart wallet setup
- `src/lib/supabase-respect.ts` - Database queries

## Common Issues

### Issue: Smart wallet not connecting

**Solution**: Check Pimlico API key and ensure you have testnet ETH

### Issue: Webhook not receiving events

**Solution**:

1. Check Alchemy webhook is active
2. Verify signing key is correct
3. Check Vercel function logs

### Issue: Database queries failing

**Solution**:

1. Verify RLS policies are set correctly
2. Check Supabase service key
3. Ensure tables exist

### Issue: Transactions failing

**Solution**:

1. Check contract addresses are correct
2. Ensure wallet has sufficient funds
3. Verify contract ABIs match deployed contracts

## Support

For issues specific to:

- **Smart Contracts**: Check `blockchain/RESPECT_GAME_README.md`
- **Database**: Check `supabase/respect-game-schema.sql` comments
- **Webhooks**: Check Vercel function logs

## Next Steps

1. Customize styling and branding
2. Add more proposal types
3. Implement X account verification
4. Add analytics dashboard
5. Create mobile-responsive designs
6. Add notifications system
7. Implement dispute resolution
8. Add token staking features

## Contract Addresses (Update These)

### Base Sepolia Testnet

```
RespectGameCore: 0x...
RespectToken: 0x...
RespectGameGovernance: 0x...
Executor: 0x...
```

### Base Mainnet (Production)

```
RespectGameCore: TBD
RespectToken: TBD
RespectGameGovernance: TBD
Executor: TBD
```

---

Built with ❤️ for the Base community
