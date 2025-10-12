# Smart Wallet + Paymaster Gas Sponsorship Setup Guide

This guide explains how to set up smart wallets with Pimlico paymaster to sponsor gas fees for your users on Base network.

## What Changed

Previously, you were using Privy's native gas sponsorship with `useSendTransaction` and the `sponsor: true` flag. This has been replaced with:

- **Smart Wallets (Account Abstraction)**: Using Pimlico's permissionless library
- **Paymaster**: Pimlico paymaster service to sponsor gas fees
- **Simple Smart Account**: ERC-4337 compliant smart account with your Privy embedded wallet as the signer

## Architecture

```
User's Privy Embedded Wallet (Signer)
         ↓
Simple Smart Account (ERC-4337)
         ↓
Pimlico Bundler + Paymaster
         ↓
Base Network (On-chain transaction with sponsored gas)
```

## Setup Steps

### 1. Get Pimlico API Key

1. Go to [Pimlico Dashboard](https://dashboard.pimlico.io/)
2. Sign up / Log in
3. Create a new project
4. Copy your API key
5. Update the API key in `src/hooks/useSmartWallet.tsx`:

```typescript
const PIMLICO_API_KEY = "YOUR_PIMLICO_API_KEY"; // Replace this!
```

### 2. Configure Paymaster Policies (Optional)

In the Pimlico dashboard, you can configure:

- **Spending Limits**: Maximum gas per transaction/day/month
- **Whitelisted Contracts**: Only sponsor transactions to specific contracts
- **Rate Limits**: Limit number of transactions per user

### 3. Fund Your Paymaster (if using custom setup)

If you're using Pimlico's Verifying Paymaster on testnet, you may need to fund it:

1. In Pimlico Dashboard, find your paymaster address
2. Send Base ETH to that address
3. The paymaster will use these funds to pay for users' gas

**Note**: Pimlico offers free sponsorship on testnets and starter plans for mainnet.

### 4. Alternative: Use Other Paymaster Providers

Instead of Pimlico, you can use:

#### **Alchemy Gas Manager**

```typescript
import { createAlchemySmartAccountClient } from "@alchemy/aa-alchemy";
import { sepolia } from "viem/chains";

const client = await createAlchemySmartAccountClient({
  chain: base,
  policyId: "YOUR_ALCHEMY_POLICY_ID",
  signer: viemWallet,
});
```

#### **Biconomy Paymaster**

```typescript
import { createSmartAccountClient } from "@biconomy/account";

const smartAccount = await createSmartAccountClient({
  signer: viemWallet,
  paymasterUrl: "YOUR_BICONOMY_PAYMASTER_URL",
});
```

## How It Works

### 1. Smart Wallet Creation

When a user logs in, the `useSmartWallet` hook:

- Gets their Privy embedded wallet
- Creates a Simple Smart Account using their embedded wallet as the signer
- Sets up a Pimlico bundler and paymaster

### 2. Transaction Flow

When sending a transaction:

1. User signs the transaction with their embedded wallet (off-chain)
2. The smart account wraps it in a UserOperation
3. The paymaster sponsors the gas fee
4. The bundler submits it to the network
5. Transaction executes on-chain with zero gas cost to the user

### 3. Key Benefits

- ✅ **Gas Sponsorship**: Users don't pay any gas fees
- ✅ **Batch Transactions**: Multiple operations in one transaction
- ✅ **Session Keys**: Enable gasless gaming/DeFi interactions
- ✅ **Recovery**: Social recovery options (future enhancement)

## Files Modified

### 1. `/src/hooks/useSmartWallet.tsx` (NEW)

Custom hook that:

- Creates a smart account using Privy embedded wallet as signer
- Configures Pimlico bundler and paymaster
- Returns the smart account client for transactions

### 2. `/src/components/ContractInteractor.tsx` (UPDATED)

- Removed `useSendTransaction` hook
- Added `useSmartWallet` hook
- Updated transaction logic to use `smartAccountClient.writeContract()`
- Added smart wallet status indicators in UI

## Testing

1. **Start your dev server**:

   ```bash
   npm run dev
   ```

2. **Log in with Privy** and navigate to the dashboard

3. **Wait for smart wallet setup** (shows "🔄 Setting up smart wallet...")

4. **Once ready**, you'll see:

   - Smart wallet address
   - Signer address (your embedded wallet)

5. **Enter a number and click "Set Number (Gas Sponsored via Paymaster)"**

6. **Sign the transaction** when prompted (this is just signing, not paying gas!)

7. **Wait for confirmation** - the transaction will be bundled and sponsored

8. **Check BaseScan** to verify the transaction (gas paid by paymaster)

## Troubleshooting

### "Paymaster error: Check your Pimlico API key"

- Verify you've replaced `YOUR_PIMLICO_API_KEY` in `useSmartWallet.tsx`
- Check your API key is valid in Pimlico dashboard

### "Insufficient funds: The paymaster may not have enough funds"

- Fund your paymaster address on Base network
- Or use Pimlico's free sponsorship tier

### "Smart wallet is not ready yet"

- Wait for the setup to complete (can take 2-3 seconds on first load)
- Check browser console for detailed error messages

### "User rejected the request"

- User needs to sign the transaction with their embedded wallet
- This is just a signature, no gas is charged

## Advanced Configuration

### Custom Smart Account Factory

You can use different smart account implementations:

```typescript
// Using Kernel instead of Simple Account
import { toKernelSmartAccount } from "permissionless/accounts";

const kernelAccount = await toKernelSmartAccount({
  client: publicClient,
  entryPoint: ENTRYPOINT_ADDRESS_V07,
  owner: viemWallet,
});
```

### Conditional Gas Sponsorship

Sponsor only specific functions:

```typescript
const shouldSponsor = (tx) => {
  // Only sponsor setNumber, not other functions
  return tx.data.includes('setNumber');
};

// In paymaster config
paymaster: shouldSponsor(tx) ? pimlicoClient : undefined,
```

### Session Keys (Advanced)

Enable gasless transactions without user signatures:

```typescript
import { toPermissionValidator } from "permissionless/accounts";

const sessionKey = await toPermissionValidator(publicClient, {
  entryPoint: ENTRYPOINT_ADDRESS_V07,
  kernelVersion: "0.3.0",
  signer: sessionKeySigner,
});
```

## Cost Considerations

### Pimlico Pricing (as of 2024)

- **Testnet**: Free unlimited sponsorship
- **Mainnet Free Tier**: 50,000 sponsored operations/month
- **Pro Tier**: $99/month + per-transaction fee
- **Enterprise**: Custom pricing

### Gas Savings

- Traditional transaction: User pays ~$0.50-$5 in gas (depending on network congestion)
- Smart wallet + paymaster: User pays $0, you pay ~$0.30-$3 per transaction

### Optimization Tips

1. **Batch transactions** to reduce per-transaction costs
2. **Set spending limits** in Pimlico dashboard
3. **Whitelist contracts** to only sponsor your app's contracts
4. **Use rate limits** to prevent abuse

## Next Steps

1. ✅ Get Pimlico API key and update the code
2. ✅ Test on Base network
3. 🔄 Monitor usage in Pimlico dashboard
4. 🔄 Set up spending limits and policies
5. 🔄 Deploy to production when ready

## Resources

- [Pimlico Documentation](https://docs.pimlico.io/)
- [Permissionless.js Docs](https://docs.pimlico.io/permissionless)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Privy + Smart Wallets Guide](https://docs.privy.io/wallets/gas-and-asset-management/gas/ethereum#react)
- [Base Network Docs](https://docs.base.org/)

## Support

If you encounter issues:

1. Check browser console for detailed errors
2. Review Pimlico dashboard for transaction status
3. Join [Pimlico Discord](https://discord.gg/pimlico)
4. Check [Privy Discord](https://discord.gg/privy)
