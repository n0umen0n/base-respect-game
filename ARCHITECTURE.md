# 🏗️ Application Architecture

## Complete System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Login Page  │  │  Dashboard   │  │    Leaderboard     │  │
│  │  (Privy)     │  │  (Contract)  │  │  (Supabase Data)   │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
           │                    │                     │
           │ Auth               │ Write Txs           │ Read Data
           ▼                    ▼                     ▼
    ┌──────────┐      ┌──────────────────┐    ┌──────────────┐
    │  Privy   │      │  Smart Wallet    │    │   Supabase   │
    │  Auth    │      │   + Paymaster    │    │   Database   │
    └──────────┘      └──────────────────┘    └──────────────┘
                               │                       ▲
                               │ Submit Tx             │ Write Data
                               ▼                       │
                      ┌──────────────────┐            │
                      │  Base Blockchain │            │
                      │   (EVM Layer 2)  │            │
                      └──────────────────┘            │
                               │                       │
                               │ Emit Events           │
                               ▼                       │
                      ┌──────────────────┐            │
                      │     Alchemy      │            │
                      │     Webhook      │────────────┘
                      └──────────────────┘
                               │
                               │ HTTP POST
                               ▼
                      ┌──────────────────┐
                      │      Vercel      │
                      │  Serverless Fn   │
                      │  (api/webhook)   │
                      └──────────────────┘
```

---

## Component Breakdown

### 1. Frontend Layer (React + Vite)

**Technology**: React 18, TypeScript, Vite, Tailwind CSS

**Components**:

- `HomePage.jsx` - Landing page
- `DashboardPage.jsx` - User dashboard with contract interaction
- `ContractInteractor.tsx` - Smart contract interface
- `Leaderboard.tsx` - Rankings display
- `ProfileCard.jsx` - User profile display

**State Management**: React hooks, Privy context

**Key Features**:

- Privy authentication
- Smart wallet integration
- Realtime Supabase subscriptions
- Responsive design

### 2. Authentication (Privy)

**What It Does**:

- Social login (Google, Twitter, Discord, etc.)
- Email/SMS authentication
- Embedded wallet creation
- Session management
- MFA support

**Integration**:

```tsx
<PrivyProvider appId="..." config={{...}}>
  <App />
</PrivyProvider>
```

### 3. Smart Wallet Layer

**Components**:

- Privy Embedded Wallet (Signer)
- Simple Smart Account (ERC-4337)
- Pimlico Bundler
- Pimlico Paymaster

**Flow**:

```
User Action → Embedded Wallet Signs → Smart Account Wraps →
Bundler Submits → Paymaster Sponsors Gas → Transaction Executes
```

**Benefits**:

- ✅ Gasless transactions for users
- ✅ Account abstraction
- ✅ Batch transactions possible
- ✅ Session keys possible (future)

### 4. Blockchain Layer (Base)

**Network**: Base (Ethereum Layer 2)
**Chain ID**: 8453 (mainnet), 84532 (testnet)

**Smart Contract**:

```solidity
contract SimpleStorageImplementation {
  uint256 public number;

  function setNumber(uint256 _number) external {
    number = _number;
    emit NumberSet(_number, msg.sender);
  }

  function increment() external {
    number = number + 1;
    emit NumberIncremented(number, msg.sender);
  }
}
```

**Events Emitted**:

- `NumberSet(uint256 indexed newNumber, address indexed setter)`
- `NumberIncremented(uint256 indexed newNumber, address indexed incrementer)`

### 5. Event Indexing (Alchemy)

**Service**: Alchemy Notify (Webhooks)

**Configuration**:

- **Type**: Address Activity
- **Address**: Your contract address
- **Events**: Event Logs
- **Network**: Base Mainnet

**What It Monitors**:

- All transactions to your contract
- All events emitted by your contract
- Sends POST request to your webhook URL

### 6. Webhook Handler (Vercel)

**File**: `api/webhook.ts`
**Runtime**: Node.js (Vercel Serverless)

**Process**:

1. Receives webhook from Alchemy
2. Verifies HMAC signature
3. Parses event data
4. Decodes blockchain event
5. Extracts user address, number, etc.
6. Saves to Supabase

**Security**:

- Signature verification with signing key
- Environment variables for secrets
- Input validation

### 7. Database Layer (Supabase)

**Technology**: PostgreSQL (Supabase-hosted)

**Tables**:

```
users
├─ wallet_address (PK)
├─ username
├─ avatar_url
└─ bio

transactions
├─ tx_hash (PK)
├─ user_address (FK → users)
├─ new_value
├─ block_timestamp
└─ gas_sponsored

leaderboard (auto-updated via triggers)
├─ user_address (PK, FK → users)
├─ current_number
├─ total_transactions
└─ highest_number

achievements (auto-created via triggers)
├─ user_address (FK → users)
├─ achievement_type
└─ earned_at
```

**Automatic Triggers**:

1. New transaction inserted → Updates leaderboard
2. New transaction inserted → Checks and awards achievements
3. New transaction inserted → Updates global stats

**Views** (pre-computed queries):

- `top_leaderboard` - Top 100 users with profiles
- `recent_transactions` - Last 100 txs with user info
- `user_stats` - Complete user statistics

---

## Data Flow Examples

### Flow 1: User Sets Number

```
1. User enters "333" in UI
   └─> ContractInteractor.tsx
       └─> handleSendTransaction()

2. Sign with embedded wallet
   └─> Privy SDK
       └─> User approves (no gas prompt!)

3. Submit via smart wallet
   └─> smartAccountClient.writeContract()
       └─> Pimlico bundler + paymaster
           └─> Base blockchain

4. Transaction confirmed
   └─> Block mined
       └─> Event: NumberSet(333, 0x...)

5. Alchemy catches event
   └─> Webhook fires
       └─> POST to vercel.app/api/webhook

6. Vercel function processes
   └─> Verify signature ✓
       └─> Parse event data
           └─> Insert to Supabase

7. Database triggers run
   └─> Update leaderboard (automatic)
       └─> Award achievements (automatic)
           └─> Update global stats (automatic)

8. Frontend receives realtime update
   └─> Supabase subscription fires
       └─> Leaderboard refreshes
           └─> User sees new ranking!
```

### Flow 2: View Leaderboard

```
1. User opens homepage
   └─> Leaderboard.tsx mounts

2. Fetch data from Supabase
   └─> getLeaderboard()
       └─> Query top_leaderboard view
           └─> Returns top 10 users

3. Display in UI
   └─> Render leaderboard
       └─> Show medals (🥇🥈🥉)

4. Subscribe to realtime updates
   └─> subscribeToLeaderboard()
       └─> Listen for changes
           └─> Auto-refresh when data changes
```

---

## Security Architecture

### Frontend Security

```
✅ Public anon key only
✅ No secrets exposed
✅ Client-side validation
✅ HTTPS only
```

### Backend Security

```
✅ Webhook signature verification
✅ Service role key (secret)
✅ Input sanitization
✅ Rate limiting (Vercel built-in)
```

### Database Security

```
✅ Row Level Security (RLS) enabled
✅ Users can only edit own profiles
✅ Blockchain data read-only
✅ Service role bypasses RLS (webhook only)
```

---

## Scalability

### Current Capacity

| Component         | Limit               | Notes                |
| ----------------- | ------------------- | -------------------- |
| Supabase Free     | 500 MB DB           | ~5M transactions     |
| Supabase Free     | 2 GB bandwidth/mo   | ~1M API requests     |
| Vercel Free       | 100 GB bandwidth/mo | ~10M function calls  |
| Alchemy Webhooks  | Unlimited           | Free on all plans    |
| Pimlico Free Tier | 50k ops/month       | Enough for most apps |

### Scaling Path

**Phase 1** (Current): Free tiers - handles 1000+ users

**Phase 2** (Growth): Paid tiers ~$50/mo - handles 10k+ users

**Phase 3** (Scale): Custom setup - unlimited users

- Add Redis caching
- Database read replicas
- CDN for static assets
- Custom indexer service

---

## Cost Breakdown

### Development (Free)

- Supabase: $0/month
- Vercel: $0/month
- Alchemy: $0/month
- Pimlico: $0/month (testnet unlimited)

### Production (Low Volume)

- Supabase: $0/month (free tier)
- Vercel: $0/month (free tier)
- Alchemy: $0/month
- Pimlico: $0/month (50k ops)

### Production (High Volume)

- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Alchemy: $0/month
- Pimlico: $99/month + per-tx

**Total**: $0-$150/month depending on scale

---

## Monitoring & Debugging

### Logs to Check

**Frontend Issues**:

```javascript
// Browser console
console.log() messages
Network tab (API calls)
Supabase connection errors
```

**Webhook Issues**:

```bash
# Vercel logs
vercel logs --follow

# Alchemy Dashboard
Notify → Webhooks → Recent Deliveries
```

**Database Issues**:

```sql
-- Supabase SQL Editor
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
SELECT * FROM leaderboard ORDER BY current_number DESC;
```

**Transaction Issues**:

```bash
# BaseScan
https://basescan.org/tx/YOUR_TX_HASH

# JiffyScan (User Operations)
https://jiffyscan.xyz/userOpHash/YOUR_OP_HASH?network=base
```

---

## Technology Stack Summary

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Auth**: Privy
- **Smart Wallets**: permissionless + Pimlico
- **Database Client**: @supabase/supabase-js

### Backend

- **Functions**: Vercel Serverless (Node.js)
- **Database**: PostgreSQL (Supabase)
- **Event Indexing**: Alchemy Webhooks
- **Smart Contracts**: Solidity 0.8.x

### Infrastructure

- **Hosting**: Vercel
- **Database**: Supabase
- **Blockchain**: Base (Ethereum L2)
- **Wallet Infrastructure**: Privy + Pimlico

---

## Key Design Decisions

### Why Supabase?

✅ PostgreSQL (proven, reliable)
✅ Realtime subscriptions built-in
✅ Auto-generated REST API
✅ Row Level Security
✅ Free tier is generous

### Why Alchemy Webhooks?

✅ Reliable delivery
✅ Free on all plans
✅ Easy setup
✅ Signature verification
✅ Retry logic built-in

### Why Vercel?

✅ Serverless = no infrastructure
✅ Auto-scaling
✅ Free tier sufficient
✅ Deploy with `vercel` command
✅ Integrated with git

### Why Pimlico?

✅ ERC-4337 standard
✅ Free tier (50k ops)
✅ Reliable bundler
✅ Good documentation
✅ Active development

---

## Future Enhancements

### Phase 1 (Next)

- [ ] User profile pages
- [ ] Transaction history view
- [ ] Achievement showcase
- [ ] Analytics dashboard

### Phase 2 (Later)

- [ ] Social features (following, comments)
- [ ] NFT badges for achievements
- [ ] Challenges between users
- [ ] Tournament system

### Phase 3 (Advanced)

- [ ] Mobile app (React Native)
- [ ] Session keys for gasless gaming
- [ ] Batch transactions
- [ ] Multi-chain support

---

**This architecture is production-ready and scales to millions of users!** 🚀
