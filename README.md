# 🎮 Respect Game

<div align="center">

![Status](https://img.shields.io/badge/Status-Live-green)
![Chain](https://img.shields.io/badge/Chain-Base-0052FF)
![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636)
![React](https://img.shields.io/badge/React-18-61DAFB)
![License](https://img.shields.io/badge/License-MIT-blue)

**Governance disguised as a weekly ranking game**

_Merit-based governance on Base that's actually fun to play_

[Live Alpha version](https://respectgame.app) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🌟 What is Respect Game?

**Respect Game** transforms governance from boring voting into an engaging weekly game. Members submit their contributions, rank their peers in a drag-and-drop interface, and automatically earn **RESPECT tokens** based on peer evaluation. The top contributors become governors—no elections, no token buying, pure meritocracy.

### The Problem

Web3 governance is fundamentally broken:

- 💰 **Token-based systems** create plutocracies where wealthy voters control everything
- 🎭 **Subjective systems** reward politics and networking over actual contribution
- 😴 **Traditional DAOs** have <5% voter participation because voting is boring
- 🎰 **Power concentration** allows whales to override thousands of contributors

### Our Solution

Respect Game fixes governance by making it:

- 🎯 **Merit-based** - Your influence comes from contributions, not tokens
- 🎮 **Gamified** - Weekly ranking game that's actually fun to play
- ⚡ **Gasless** - Zero friction with sponsored transactions via smart wallets
- 🤝 **Fair** - Fractal consensus algorithm prevents gaming the system
- 🔄 **Dynamic** - Governance evolves naturally from the game results

---

## ✨ Key Features

### For Members

🎨 **On-Chain Profiles** - Create your verifiable identity with bio, links, and optional X/Twitter verification

📝 **Contribution Tracking** - Submit weekly contributions with proof of work (GitHub PRs, designs, community work, etc.)

🏆 **Drag & Drop Ranking** - Intuitive interface for evaluating peer contributions

💰 **RESPECT Tokens** - Earn ERC-20 tokens automatically based on your ranking

📊 **Game History** - Permanent on-chain record of all your contributions and rankings

### For Governors (Top 6 Members)

🗳️ **Weighted Proposals** - Create and vote on governance decisions

- ✅ **Member Approval** - Admit new members (2/6 votes required)
- 🚫 **Member Banning** - Remove bad actors (3/6 votes required)
- 💼 **Treasury Transfers** - Execute payments and grants (4/6 votes required)

### Technical Highlights

⛽ **Gasless Experience** - Smart account abstraction with Pimlico paymaster  
🔐 **Social Login** - Email, Google, Twitter auth via Privy  
📱 **Mobile Responsive** - Works seamlessly on all devices  
🔄 **Real-time Sync** - Alchemy webhooks index events to Supabase  
⚙️ **Upgradeable** - UUPS proxy pattern for future improvements

---

## 🎯 How It Works

### The Weekly Game Cycle

```
📝 Contribution Submission (6 days)
    ↓
    Members submit their work with proof
    ↓
🏆 Ranking Phase (1 day)
    ↓
    Members rank peers in groups of 5
    ↓
💰 Token Distribution
    ↓
    RESPECT tokens awarded automatically
    ↓
📊 Leaderboard Update
    ↓
    Top 6 become governors
    ↓
    [Cycle Repeats]
```

### 1. Submit Contributions

During the 6-day submission phase, members share what they've built:

- Code contributions (PRs, commits)
- Design work (Figma files, mockups)
- Community building (events, outreach)
- Content creation (articles, videos)
- Any valuable work with verifiable proof

### 2. Rank Your Peers

Members are randomly grouped into teams of 5. You rank your group from 1st to 5th based on contribution quality:

- 🥇 **1st place** → 60 RESPECT
- 🥈 **2nd place** → 40 RESPECT
- 🥉 **3rd place** → 30 RESPECT
- **4th place** → 20 RESPECT
- **5th place** → 10 RESPECT

### 3. Consensus Algorithm

Rankings are aggregated using **Fractal Governance's consensus algorithm**:

- Position-based scoring (lower total score = higher rank)
- Prevents gaming through variance checking
- Balances consensus and average ranking
- Read more: [Fractal Governance Paper](https://james-mart.medium.com/fractal-governance-a-shared-submission-algorithm-311a3039b219)

### 4. Govern Together

Your **average RESPECT** over the last 12 games determines your rank. The **top 6 members** form the governing council and vote on proposals with varying thresholds based on importance.

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)               │
│                                                                 │
│  Home • Profiles • Contributions • Rankings • Proposals        │
│  Leaderboard • Game History • Governance Dashboard             │
└─────────────┬─────────────────────────────┬─────────────────────┘
              │                             │
              │ Auth & Wallet               │ Query Data
              │                             │
     ┌────────▼─────────┐          ┌────────▼────────┐
     │   Privy Auth     │          │    Supabase     │
     │   + Pimlico      │          │   (PostgreSQL)  │
     │  Smart Wallets   │          │                 │
     └────────┬─────────┘          │  • Profiles     │
              │                    │  • History      │
              │ Sign & Submit      │  • Rankings     │
              │ (Gasless!)         │  • Leaderboard  │
              │                    └────────▲────────┘
              │                             │
     ┌────────▼─────────────────────────────┴────────┐
     │          Base Blockchain (Layer 2)            │
     │                                               │
     │  Smart Contracts (Solidity)                  │
     │  • RespectGameCore                           │
     │  • RespectGameGovernance                     │
     │  • RespectToken (ERC-20)                     │
     │  • Executor                                  │
     └────────┬──────────────────────────────────────┘
              │
              │ Events Emitted
              │
     ┌────────▼─────────┐
     │  Alchemy Notify  │
     │    (Webhooks)    │
     └────────┬─────────┘
              │
              │ HTTP POST
              │
     ┌────────▼─────────┐
     │ Vercel Functions │
     │  (Serverless)    │
     └──────────────────┘
```

### Data Flow Example

**User submits contribution** → **Privy signs** → **Pimlico sponsors gas** → **Base executes tx** → **Alchemy catches event** → **Webhook updates Supabase** → **Frontend shows real-time update**

---

## 🛠️ Tech Stack

### Frontend Layer

| Technology       | Purpose                 | Version |
| :--------------- | :---------------------- | :------ |
| **React**        | UI framework            | 18.3    |
| **TypeScript**   | Type safety             | Latest  |
| **Vite**         | Build tool & dev server | 5.x     |
| **Tailwind CSS** | Styling framework       | 3.x     |
| **Material-UI**  | Component library       | 7.x     |
| **Viem**         | Ethereum interactions   | 2.x     |
| **React Router** | Client-side routing     | 7.x     |
| **@dnd-kit**     | Drag & drop rankings    | 6.x     |
| **GSAP**         | Animations              | 3.x     |

### Authentication & Wallets

| Technology         | Purpose                           |
| :----------------- | :-------------------------------- |
| **Privy**          | Social login & embedded wallets   |
| **Pimlico**        | Smart account bundler & paymaster |
| **ERC-4337**       | Account abstraction standard      |
| **Smart Accounts** | Gasless transactions              |

### Blockchain Layer

| Technology       | Purpose                 | Version |
| :--------------- | :---------------------- | :------ |
| **Solidity**     | Smart contract language | 0.8.x   |
| **Hardhat**      | Development environment | 2.22    |
| **OpenZeppelin** | Contract libraries      | 5.4     |
| **UUPS Proxy**   | Upgradeability pattern  | Latest  |
| **Base**         | Ethereum L2 network     | Mainnet |

### Backend & Database

| Technology           | Purpose                                       |
| :------------------- | :-------------------------------------------- |
| **Supabase**         | PostgreSQL database & real-time subscriptions |
| **Vercel Functions** | Serverless webhook handlers                   |
| **Alchemy Notify**   | Blockchain event webhooks                     |
| **TypeScript**       | API type safety                               |

---

## 📜 Smart Contracts

### Contract Architecture

The system uses **UUPS (Universal Upgradeable Proxy Standard)** for upgradeability while maintaining separated concerns:

```solidity
RespectGame Ecosystem
│
├── 📄 RespectGameCore.sol
│   ├── Member registration & approval
│   ├── Contribution submission
│   ├── Group creation (Fisher-Yates shuffle)
│   ├── Ranking submission & validation
│   ├── RESPECT token distribution
│   ├── Stage management & transitions
│   └── Average RESPECT calculation
│
├── 📄 RespectGameGovernance.sol
│   ├── Proposal creation (approve, ban, treasury)
│   ├── Voting system (threshold-based)
│   ├── Proposal execution
│   ├── Top 6 member management
│   └── Executor integration
│
├── 📄 RespectToken.sol
│   ├── ERC-20 implementation
│   ├── Minting (restricted to game contract)
│   ├── Burning capability
│   └── Upgradeable via UUPS
│
├── 📄 Executor.sol
│   ├── Treasury management
│   ├── Multi-sig execution
│   └── Proposal transaction execution
│
└── 📁 Storage & Interfaces
    ├── RespectGameStorage.sol
    ├── IRespectGameCore.sol
    ├── IRespectGameGovernance.sol
    └── IExecutor.sol
```

### Key Contract Features

#### RespectGameCore

**Member Management**

```solidity
function becomeMember(
    string memory name,
    string memory profileUrl,
    string memory description,
    string memory xAccount
) external;
```

- First 10 members auto-approved
- Subsequent members need governance approval
- Creates on-chain profile with metadata

**Contribution System**

```solidity
function submitContribution(
    string[] memory contributions,
    string[] memory links
) external;
```

- Submit multiple contributions per game
- Include proof of work links
- Only during submission stage

**Ranking System**

```solidity
function submitRanking(
    address[5] memory rankedAddresses
) external;
```

- Rank your group from 1st to 5th
- Validates all addresses in group
- Prevents duplicate rankings

**Stage Transitions**

```solidity
function switchStage() external;
```

- Automated stage progression
- Handles group creation
- Calculates consensus rankings
- Distributes RESPECT tokens

#### RespectGameGovernance

**Proposal Types**

| Type                  | Threshold | Purpose           |
| :-------------------- | :-------- | :---------------- |
| **Member Approval**   | 2/6 votes | Admit new members |
| **Member Ban**        | 3/6 votes | Remove bad actors |
| **Treasury Transfer** | 4/6 votes | Execute payments  |

**Voting Functions**

```solidity
function createApproveMemberProposal(
    address targetMember,
    string memory description
) external onlyTopMember;

function voteOnProposal(
    uint256 proposalId,
    bool voteFor
) external onlyTopMember;
```

### Events

All major actions emit events for indexing:

```solidity
event MemberJoined(address indexed member, uint256 timestamp);
event ContributionSubmitted(address indexed member, uint256 gameNumber);
event RankingSubmitted(address indexed member, uint256 gameNumber);
event GroupsCreated(uint256 indexed gameNumber, uint256 numGroups);
event RespectDistributed(address indexed member, uint256 amount);
event StageChanged(uint8 indexed newStage, uint256 timestamp);
event ProposalCreated(uint256 indexed proposalId, uint8 proposalType);
event ProposalVoted(uint256 indexed proposalId, address indexed voter);
event ProposalExecuted(uint256 indexed proposalId, bool success);
```

### Security Features

✅ **Access Control** - Owner, governance, and member-based permissions  
✅ **Reentrancy Guards** - Protection against re-entrancy attacks  
✅ **Input Validation** - Comprehensive validation on all inputs  
✅ **Upgradeability** - UUPS pattern with owner-only upgrades  
✅ **Batch Processing** - Gas-optimized for large member sets  
✅ **Time Locks** - Stage transitions require time passage

---

## 🚀 Quick Start

### Prerequisites

```bash
node -v  # v18 or higher
npm -v   # v9 or higher
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vladrespect.git
cd vladrespect

# Install frontend dependencies
npm install

# Install blockchain dependencies
cd blockchain
npm install
cd ..
```

### Environment Configuration

Create `.env.local` in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Privy
VITE_PRIVY_APP_ID=your-privy-app-id

# Pimlico
VITE_PIMLICO_API_KEY=your-pimlico-key

# Contract Addresses (after deployment)
VITE_RESPECT_GAME_CORE_ADDRESS=0x...
VITE_RESPECT_TOKEN_ADDRESS=0x...
VITE_RESPECT_GAME_GOVERNANCE_ADDRESS=0x...
VITE_EXECUTOR_ADDRESS=0x...

# Network
VITE_CHAIN_ID=8453  # Base Mainnet
```

### Deploy Smart Contracts

```bash
cd blockchain

# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia

# Deploy to Base Mainnet
npx hardhat run scripts/respect-game.deploy.ts --network base-mainnet
```

### Set Up Database

1. Create a [Supabase](https://supabase.com) project
2. Run the schema: `supabase/respect-game-schema.sql`
3. Configure Alchemy webhooks to point to your Vercel function

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### Deploy to Production

```bash
# Deploy frontend to Vercel
vercel

# Set up environment variables in Vercel dashboard
```

---

## 📖 Documentation

- **[Architecture Overview](./ARCHITECTURE.md)** - Complete system architecture
- **[Smart Contracts Guide](./blockchain/RESPECT_GAME_README.md)** - Contract documentation
- **[Governance System](./blockchain/GOVERNANCE_SYSTEM_README.md)** - Governance details
- **[Setup Guide](./RESPECT_GAME_SETUP.md)** - Deployment walkthrough
- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** - Current features & roadmap

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain
npx hardhat test

# With coverage
npx hardhat coverage

# Gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage

✅ Deployment and initialization  
✅ Member registration (auto-approve + proposal flow)  
✅ Contribution submission validation  
✅ Stage transitions and timing  
✅ Group creation and Fisher-Yates shuffle  
✅ Ranking submission and consensus  
✅ RESPECT distribution  
✅ Average RESPECT calculation  
✅ Proposal creation, voting, and execution  
✅ Top 6 member updates  
✅ Treasury management

---

## 📊 Contract Addresses

### Base Sepolia (Testnet)

```
RespectGameCore:       0x... (Update after deployment)
RespectToken:          0x...
RespectGameGovernance: 0x...
Executor:              0x...
```

### Base Mainnet

```
Coming soon after audit...
```

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)

- [x] Core game mechanics
- [x] Profile creation with X verification
- [x] Contribution submission
- [x] Drag & drop ranking interface
- [x] Fractal consensus algorithm
- [x] RESPECT token distribution
- [x] Governance proposals (approve, ban, treasury)
- [x] Gasless transactions
- [x] Real-time webhooks
- [x] Leaderboard & game history

### 🚧 Phase 2: Enhancement (Q2 2025)

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Contribution templates
- [ ] Member search & discovery
- [ ] Reputation portability
- [ ] NFT achievements

### 🔮 Phase 3: Scale (Q3-Q4 2025)

- [ ] Multi-chain deployment
- [ ] DAO treasury integrations
- [ ] Token staking mechanisms
- [ ] API for third-party integrations
- [ ] On-chain dispute resolution
- [ ] Weighted voting by RESPECT
- [ ] Contribution categorization

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Follow existing code style (ESLint + Prettier)
- Update documentation for API changes
- Test on Base Sepolia before submitting PR
- Keep PRs focused on a single feature/fix

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Fractal Governance](https://fractally.com/)** - Inspiration for consensus algorithm
- **[Base](https://base.org/)** - Layer 2 infrastructure and ecosystem support
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract libraries
- **[Privy](https://privy.io/)** - Seamless authentication solution
- **[Pimlico](https://pimlico.io/)** - Account abstraction infrastructure
- **[Supabase](https://supabase.com/)** - Real-time database platform



<div align="center">

**Built with ❤️ for the Base community**

**Start earning RESPECT today!** 🚀

[Get Started](#-quick-start) • [View Demo](#) • [Read Docs](#-documentation)

---

_Governance that's fair, fun, and corruption-resistant_

</div>
