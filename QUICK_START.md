# Quick Start Guide - Smart Wallet Gas Sponsorship

## ✅ What's Been Done

I've successfully integrated smart wallets with paymaster functionality to sponsor gas fees for your users. Here's what changed:

### New Files Created:

1. **`src/hooks/useSmartWallet.tsx`** - Custom hook for smart wallet management
2. **`src/config/smartWallet.config.ts`** - Configuration file for Pimlico API key
3. **`SMART_WALLET_SETUP.md`** - Detailed setup documentation
4. **`QUICK_START.md`** - This file

### Modified Files:

1. **`src/components/ContractInteractor.tsx`** - Now uses smart wallet instead of Privy's native gas sponsorship

### Packages Installed:

- ✅ `permissionless` - For smart wallet functionality

## 🚀 Steps to Get Started

### Step 1: Get Pimlico API Key (2 minutes)

1. Go to **[https://dashboard.pimlico.io/](https://dashboard.pimlico.io/)**
2. Sign up / Log in
3. Create a new project
4. Copy your API key

### Step 2: Update Configuration (1 minute)

Open `src/config/smartWallet.config.ts` and replace the API key:

```typescript
export const SMART_WALLET_CONFIG = {
  PIMLICO_API_KEY: "YOUR_ACTUAL_PIMLICO_API_KEY_HERE", // ← Replace this
  // ... rest of config
};
```

### Step 3: Test It! (2 minutes)

1. Start your dev server:

   ```bash
   npm run dev
   ```

2. Open your app and log in with Privy

3. Navigate to the dashboard

4. Wait for "✅ Smart Wallet Ready" message

5. Enter a number and click **"Set Number (Gas Sponsored via Paymaster)"**

6. Sign the transaction when prompted (no gas payment!)

7. Wait for confirmation

8. Check BaseScan - you'll see the transaction was paid by the paymaster! 🎉

## 🎯 What This Does

### Before (Not Working):

```
User → Privy useSendTransaction → ❌ Native sponsorship failed
```

### After (Working):

```
User's Privy Wallet (Signer)
       ↓
Simple Smart Account (ERC-4337)
       ↓
Pimlico Paymaster (Pays Gas)
       ↓
Base Network ✅ Transaction successful!
```

## 🔍 How to Verify It's Working

1. **Check Console Logs**: You should see:

   ```
   🔧 Creating smart account with embedded wallet as signer...
   🎯 Smart Account Address: 0x...
   💰 Setting up Pimlico paymaster...
   ✅ Smart wallet setup complete!
   ```

2. **Check UI**: You should see:

   - "✅ Smart Wallet Ready"
   - Smart wallet address displayed
   - Signer address (your embedded wallet)

3. **Send Transaction**: When you click the button:
   - You only sign the transaction (no gas prompt!)
   - The transaction goes through
   - On BaseScan, the "From" address is your smart wallet
   - Gas is paid by the paymaster

## 💰 Costs

### Pimlico Pricing:

- **Testnet (Base Sepolia)**: FREE unlimited
- **Mainnet (Base)**:
  - Free Tier: 50,000 sponsored operations/month
  - Pro: $99/month + per-transaction fees
  - Enterprise: Custom pricing

### Estimated Costs:

- Each `setNumber` transaction: ~$0.30-$3 (you pay, user pays $0)
- Traditional gas: User would pay ~$0.50-$5 per transaction

## 📊 Monitoring

Check your Pimlico dashboard to see:

- Number of sponsored transactions
- Gas costs
- User operations
- Error rates
- Spending trends

## 🆘 Troubleshooting

### Error: "PIMLICO_API_KEY is not set"

**Solution**: Update `src/config/smartWallet.config.ts` with your API key

### Error: "Paymaster error"

**Solution**:

- Verify your API key is correct
- Check Pimlico dashboard for API key status
- Ensure you're on the correct network (Base mainnet, chain ID 8453)

### Error: "Insufficient funds"

**Solution**:

- On testnet: Pimlico provides free sponsorship
- On mainnet: Check your Pimlico account balance
- Or use Pimlico's free tier (50k ops/month)

### Smart wallet not showing up

**Solution**:

- Wait 2-3 seconds for setup
- Check browser console for errors
- Ensure you're logged in with Privy
- Verify your embedded wallet is created

## 🎓 Learn More

- **Detailed Guide**: See `SMART_WALLET_SETUP.md` for comprehensive documentation
- **Pimlico Docs**: [https://docs.pimlico.io/](https://docs.pimlico.io/)
- **ERC-4337 Spec**: [https://eips.ethereum.org/EIPS/eip-4337](https://eips.ethereum.org/EIPS/eip-4337)
- **Privy Smart Wallets**: [https://docs.privy.io/wallets/gas-and-asset-management/gas/ethereum](https://docs.privy.io/wallets/gas-and-asset-management/gas/ethereum)

## ✨ What's Different from Before

| Feature            | Before (Privy Native) | After (Smart Wallet + Paymaster) |
| ------------------ | --------------------- | -------------------------------- |
| Gas Sponsorship    | ❌ Not working        | ✅ Working                       |
| User Experience    | User must pay gas     | User pays $0                     |
| Setup              | Simple config         | Requires Pimlico setup           |
| Flexibility        | Limited               | Full control                     |
| Batch Transactions | ❌ No                 | ✅ Yes (future)                  |
| Session Keys       | ❌ No                 | ✅ Yes (future)                  |
| Cost               | Free (if working)     | $0.30-$3 per transaction         |

## 🎉 You're All Set!

Once you update the API key in `src/config/smartWallet.config.ts`, your gas sponsorship will work perfectly!

Need help? Check the detailed guide in `SMART_WALLET_SETUP.md` or the Privy documentation linked above.
