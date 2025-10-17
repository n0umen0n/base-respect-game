# 🎮 Respect Game

A decentralized reputation and governance system built on Base that rewards community members for their contributions through peer evaluation and democratic governance.

![Status](https://img.shields.io/badge/Status-Beta-yellow)
![Base](https://img.shields.io/badge/Chain-Base-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Overview

Respect Game is a periodic reputation system where community members:

1. **Submit Contributions** - Share what you've built or contributed
2. **Rank Peers** - Evaluate your group's contributions through ranking
3. **Earn RESPECT** - Receive tokens based on peer evaluations
4. **Govern Together** - Top members vote on proposals

## ✨ Key Features

### For Members

- 🎨 **Profile Creation** - Create your on-chain identity
- 📝 **Contribution Tracking** - Submit contributions with proof of work
- 🏆 **Peer Ranking** - Drag-and-drop interface for ranking
- 💰 **RESPECT Tokens** - Earn tokens based on performance
- 📊 **Historical Data** - Track your progress over time
- ✅ **X Verification** - Link and verify your X/Twitter account

### For Governance

- 🗳️ **Proposal Voting** - Top 6 members vote on proposals
- 👥 **Member Approval** - Approve new members (2 votes)
- 🚫 **Member Banning** - Ban problematic members (3 votes)
- 💼 **Treasury Management** - Execute transactions (4 votes)

### Technical Features

- ⛽ **Gasless Transactions** - Smart wallet with sponsored gas
- 🔐 **Easy Login** - Social login via Privy
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔄 **Real-time Updates** - Webhooks sync contract events
- 🗄️ **Off-chain Storage** - Efficient data queries via Supabase

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React + TS)   │
│                 │
│  - Profile      │
│  - Contributions│
│  - Rankings     │
│  - Proposals    │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
┌────────▼────────┐ ┌──▼──────────┐
│ Smart Contracts │ │  Supabase   │
│    (Solidity)   │ │  (Postgres) │
│                 │ │             │
│  - Core Logic   │ │  - Profiles │
│  - Governance   │ │  - History  │
│  - Token        │ │  - Rankings │
└────────┬────────┘ └──▲──────────┘
         │              │
         └──────┬───────┘
                │
         ┌──────▼────────┐
         │   Webhooks    │
         │ (Alchemy →    │
         │  Vercel)      │
         └───────────────┘
```

## 🚀 Quick Start

### Prerequisites

```bash
node -v  # v18+
npm -v   # v9+
```

### Installation

```bash
# Clone repository
git clone <repo-url>
cd vladrespect

# Install dependencies
npm install

# Install blockchain dependencies
cd blockchain
npm install
cd ..
```

### Configuration

1. **Create `.env.local`**:

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# Contracts (after deployment)
VITE_RESPECT_GAME_CORE_ADDRESS=0x...
VITE_RESPECT_TOKEN_ADDRESS=0x...
VITE_RESPECT_GAME_GOVERNANCE_ADDRESS=0x...
```

2. **Deploy Contracts**:

```bash
cd blockchain
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia
```

3. **Set Up Database**:

- Create Supabase project
- Run `supabase/respect-game-schema.sql`

4. **Start Development**:

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📖 Documentation

- **[Setup Guide](./RESPECT_GAME_SETUP.md)** - Complete deployment guide
- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** - What's built and what's next
- **[Smart Contracts](./blockchain/RESPECT_GAME_README.md)** - Contract documentation
- **[Governance System](./blockchain/GOVERNANCE_SYSTEM_README.md)** - Governance details

## 🎯 How It Works

### Game Cycle

```
Contribution Submission (7 days)
    ↓
    Members submit contributions
    ↓
Ranking Phase (3 days)
    ↓
    Members rank their group
    ↓
Distribution
    ↓
    RESPECT tokens distributed
    ↓
    [Next Game Starts]
```

### Ranking Algorithm

Uses **Fractal Governance's Shared Submission Algorithm**:

- Combines consensus and average ranking
- Higher consensus = more weight
- Prevents gaming through variance checking
- Read more: [Fractal Governance Paper](https://james-mart.medium.com/fractal-governance-a-shared-submission-algorithm-311a3039b219)

### RESPECT Distribution

Groups are sized 2-5 members. Distribution per group:

- 1st place: 60 RESPECT
- 2nd place: 40 RESPECT
- 3rd place: 30 RESPECT
- 4th place: 20 RESPECT
- 5th place: 10 RESPECT

Average RESPECT determines rank (averaged over last N games).

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Viem** - Ethereum interactions
- **Privy** - Authentication
- **Material-UI** - Component library
- **@dnd-kit** - Drag and drop
- **GSAP** - Animations

### Smart Contracts

- **Solidity 0.8.x** - Smart contracts
- **Hardhat** - Development environment
- **OpenZeppelin** - Contract libraries
- **UUPS Proxy** - Upgradeability

### Backend

- **Supabase** - Database & auth
- **Vercel Functions** - Serverless webhooks
- **Alchemy** - Web3 infrastructure

## 📱 Pages & Components

### 1. Home Page

- Leaderboard (top 6 featured)
- Login button
- Overview of Respect Game

### 2. Profile Creation

- Name, bio, profile picture
- X/Twitter account (optional)
- On-chain profile storage

### 3. Contribution Submission

- Multiple contributions
- Links for proof of work
- Countdown to next stage
- Google Calendar integration

### 4. Ranking Page

- Drag-and-drop interface
- View peer contributions
- Expandable cards
- Submit rankings

### 5. Profile Page

- RESPECT score & balance
- Game history
- Members vouched for
- Contribution history

### 6. Proposals Page

- Color-coded by type
- Live vs historical
- Voting interface (top 6)
- Progress indicators

## 🔒 Security Features

- **Upgradeable Contracts** - UUPS proxy pattern
- **Access Control** - Owner and governance roles
- **Reentrancy Guards** - Protection against attacks
- **Input Validation** - All inputs validated
- **RLS Policies** - Database security
- **Webhook Verification** - Signed webhooks

## 🧪 Testing

```bash
# Smart contract tests
cd blockchain
npx hardhat test

# Frontend tests (when implemented)
npm test

# Coverage
npx hardhat coverage
```

## 🚢 Deployment

### Testnet (Base Sepolia)

```bash
# Deploy contracts
cd blockchain
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia

# Deploy frontend
vercel

# Set up webhooks in Alchemy dashboard
```

### Mainnet (Base)

```bash
# Same as testnet but use --network base
# IMPORTANT: Audit contracts before mainnet deployment
```

## 📊 Contract Addresses

### Base Sepolia (Testnet)

```
RespectGameCore: TBD
RespectToken: TBD
RespectGameGovernance: TBD
Executor: TBD
```

### Base Mainnet

```
Coming soon...
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Test on testnet before PR

## 🐛 Known Issues

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for:

- Current limitations
- Planned improvements
- Known bugs

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙏 Acknowledgments

- **Fractal Governance** - Ranking algorithm inspiration
- **Base** - L2 infrastructure
- **OpenZeppelin** - Smart contract libraries
- **Privy** - Authentication solution

## 📞 Support

- **Issues**: [GitHub Issues](your-repo/issues)
- **Discussions**: [GitHub Discussions](your-repo/discussions)
- **Twitter**: [@RespectGame](https://twitter.com/respectgame)

## 🗺️ Roadmap

### Phase 1: MVP (Current)

- [x] Core game mechanics
- [x] Profile creation
- [x] Contribution submission
- [x] Peer ranking
- [x] Basic governance
- [ ] X account verification
- [ ] Mainnet deployment

### Phase 2: Enhancement

- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Notification system
- [ ] Contribution templates
- [ ] Member search & discovery

### Phase 3: Scale

- [ ] Multi-chain support
- [ ] DAO treasury management
- [ ] Token staking
- [ ] Reputation portability
- [ ] API for integrations

---

**Built with ❤️ for the Base community**

**Start earning RESPECT today!** 🚀
