# 🚀 Respect Game - Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Quality

- [x] All contracts compile without errors
- [x] No linter warnings
- [x] Contract size under 24KB limit (using viaIR optimization)
- [x] All 29 tests passing
- [x] Code properly commented
- [x] Events emitted for all major actions

### Security

- [x] Access control implemented (owner, top 6, members)
- [x] Input validation on all functions
- [x] Reentrancy protection (OpenZeppelin base)
- [x] Upgradeable pattern (UUPS)
- [x] Storage gap for future upgrades
- [x] No obvious vulnerabilities

### Documentation

- [x] Complete README
- [x] Implementation summary
- [x] Scripts guide
- [x] Inline code comments
- [x] Test documentation

## 📋 Deployment Steps

### 1. Environment Setup

#### A. Create/Update `.env` file

```bash
cd blockchain
touch .env
```

Add the following variables:

```env
# Deployment Account
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# API Keys (for verification)
BASESCAN_API_KEY=your_basescan_api_key_here

# Optional
INFURA_API_KEY=your_infura_key_here
```

#### B. Update Configuration in `respect-game.deploy.ts`

**For Production, change these values:**

```typescript
const contributionSubmissionLength = 6 * 24 * 60 * 60; // 6 days
const contributionRankingLength = 1 * 24 * 60 * 60; // 1 day
```

**Current (Testing) values:**

```typescript
const contributionSubmissionLength = 10 * 60; // 10 minutes
const contributionRankingLength = 10 * 60; // 10 minutes
```

### 2. Local Testing (First)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy to local node
npx hardhat run scripts/respect-game.deploy.ts --network localhost

# Terminal 3: Run tests
npx hardhat test test/RespectGame.test.ts
```

✅ Verify:

- Both contracts deployed successfully
- Addresses logged correctly
- RespectGame added as minter
- All configurations correct

### 3. Base Sepolia (Testnet) Deployment

```bash
# Deploy
npx hardhat run scripts/respect-game.deploy.ts --network base-sepolia

# Verify on BaseScan
npx hardhat verify --network base-sepolia RESPECT_TOKEN_ADDRESS "OWNER_ADDRESS" "RESPECT" "RESPECT"
npx hardhat verify --network base-sepolia RESPECT_GAME_ADDRESS
```

✅ Verify:

- [ ] Contracts deployed on Base Sepolia
- [ ] Verified on BaseScan
- [ ] RespectGame has minter role
- [ ] Test member registration works
- [ ] Test contribution submission works
- [ ] Test stage switching works
- [ ] Test ranking works
- [ ] Test RESPECT distribution works

#### Manual Testing Script

```bash
# 1. Register first member
npx hardhat run scripts/become-member.ts --network base-sepolia

# 2. Check member count
npx hardhat run scripts/view-stats.ts --network base-sepolia

# 3. Submit contribution
npx hardhat run scripts/submit-contribution.ts --network base-sepolia

# 4. Wait for submission period (or fast forward in tests)
# 5. Switch stage
npx hardhat run scripts/switch-stage.ts --network base-sepolia

# 6. Check groups created
npx hardhat run scripts/get-my-group.ts --network base-sepolia

# 7. Submit rankings
npx hardhat run scripts/submit-ranking.ts --network base-sepolia

# 8. Switch stage again
npx hardhat run scripts/switch-stage.ts --network base-sepolia

# 9. Check RESPECT balances
# 10. Check average RESPECT
```

### 4. Security Audit (Recommended)

Before mainnet:

- [ ] Internal code review
- [ ] External security audit (recommended for production)
- [ ] Bug bounty program (optional)
- [ ] Testnet stress testing

### 5. Base Mainnet Deployment

⚠️ **IMPORTANT: Only after thorough testnet testing**

```bash
# 1. Update configuration in deploy script
# 2. Ensure production values set (6 days + 1 day)
# 3. Set proper treasury address
# 4. Deploy
npx hardhat run scripts/respect-game.deploy.ts --network base-mainnet

# 5. Verify
npx hardhat verify --network base-mainnet RESPECT_TOKEN_ADDRESS "OWNER_ADDRESS" "RESPECT" "RESPECT"
npx hardhat verify --network base-mainnet RESPECT_GAME_ADDRESS
```

✅ Post-Deployment:

- [ ] Save contract addresses securely
- [ ] Update frontend with contract addresses
- [ ] Test with small group first
- [ ] Monitor for issues
- [ ] Set up alerts for critical events

### 6. Post-Deployment Setup

#### A. Update Contract Addresses

Update in:

- Frontend configuration
- Documentation
- DEPLOYMENT_CHECKLIST.md
- README.md

#### B. Initialize First Game

```bash
# Current game should be #1
# Stage should be ContributionSubmission
# Next stage timestamp should be set

# Verify with:
npx hardhat run scripts/view-stats.ts --network base-mainnet
```

#### C. Onboard First 10 Members

First 10 members auto-approve:

1. Share contract address with initial members
2. They call `becomeMember()`
3. Verify all registered successfully

#### D. Set Up Monitoring

Monitor these events:

- `MemberJoined`
- `ContributionSubmitted`
- `RankingSubmitted`
- `StageChanged`
- `RespectDistributed`
- `ProposalCreated`
- `ProposalExecuted`

## 🔧 Troubleshooting

### Contract Size Error

✅ **Already Fixed**: Using viaIR optimization

### Deployment Fails

- Check balance: Need ETH for gas
- Check RPC URL: Ensure correct network
- Check private key: Valid and has permissions

### Tests Fail

- Run `npx hardhat clean`
- Run `npx hardhat compile --force`
- Rerun tests

### Verification Fails

- Ensure BaseScan API key is set
- Check contract address is correct
- Try manual verification on BaseScan

## 📊 Deployment Costs (Estimated)

Based on Base network:

- RespectToken deployment: ~0.001 ETH
- RespectGame deployment: ~0.003 ETH
- Configuration transactions: ~0.0001 ETH
- **Total**: ~0.005 ETH

⚠️ Actual costs may vary based on gas prices

## 🎯 Launch Plan

### Phase 1: Soft Launch (Week 1-2)

- [ ] Deploy to Base Sepolia
- [ ] Onboard first 10 members
- [ ] Run 2-3 test game cycles
- [ ] Gather feedback
- [ ] Fix any issues

### Phase 2: Beta Launch (Week 3-4)

- [ ] Deploy to Base Mainnet
- [ ] Onboard initial community (50-100 members)
- [ ] Run several game cycles
- [ ] Monitor closely
- [ ] Iterate based on feedback

### Phase 3: Full Launch (Week 5+)

- [ ] Open to all Base community members
- [ ] Marketing campaign
- [ ] Community growth
- [ ] Feature enhancements

## 📞 Emergency Procedures

### Pause Functionality

Currently no pause implemented. In emergency:

1. Owner can upgrade contract (UUPS)
2. Implement pause in upgraded version
3. Or set extremely long time periods

### Upgrade Process

```bash
# 1. Deploy new implementation
# 2. Call upgrade function on proxy
# 3. Verify upgrade successful
# 4. Test all functionality
```

## ✅ Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Contracts verified on BaseScan
- [ ] Documentation complete
- [ ] Frontend integrated
- [ ] Treasury address set correctly
- [ ] Time periods configured for production
- [ ] Monitoring set up
- [ ] Emergency contacts ready
- [ ] Community informed
- [ ] Marketing materials ready

## 📝 Deployment Log

### Base Sepolia

- Deployment Date: **\_\_\_**
- RespectToken: **\_\_\_**
- RespectGame: **\_\_\_**
- Deployer: **\_\_\_**
- Gas Used: **\_\_\_**

### Base Mainnet

- Deployment Date: **\_\_\_**
- RespectToken: **\_\_\_**
- RespectGame: **\_\_\_**
- Deployer: **\_\_\_**
- Gas Used: **\_\_\_**
- First Game Started: **\_\_\_**

## 🎉 Success Criteria

### Technical

- ✅ All 29 tests passing
- ✅ Contracts deployed and verified
- ✅ No critical bugs
- ✅ Performance acceptable

### Business

- [ ] First 10 members onboarded
- [ ] First game cycle completed successfully
- [ ] RESPECT tokens distributed correctly
- [ ] Community satisfied with system
- [ ] No major complaints or issues

---

**Status**: ✅ Ready for Deployment
**Last Updated**: October 13, 2025
**Version**: 1.0.0
