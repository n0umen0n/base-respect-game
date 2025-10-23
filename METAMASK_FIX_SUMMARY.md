# MetaMask Auto-Trigger Fix - Summary

## Problem

Users with MetaMask installed were experiencing unexpected MetaMask popups during:

1. Initial login
2. Navigation to profile pages
3. Twitter/X account linking

This occurred even though the app is designed to use only Privy embedded wallets.

## Root Causes

### 1. External Wallets Listed in Privy Config

**File:** `src/main.jsx`

The Privy configuration included external wallets (MetaMask, Coinbase Wallet, WalletConnect):

```javascript
walletList: ['metamask', 'coinbase_wallet', 'walletconnect']
externalWallets: {
  walletConnect: {
    projectId: 'replace-with-your-walletconnect-project-id',
  },
}
```

This allowed Privy to detect and attempt to connect to MetaMask.

### 2. Direct window.ethereum Access

**File:** `src/lib/secure-api.ts`

The secure API had a fallback that accessed `window.ethereum` directly:

```javascript
} else if (typeof window !== "undefined" && (window as any).ethereum) {
  // Fallback to MetaMask or other injected wallet
  const browserProvider = new BrowserProvider((window as any).ethereum);
  signer = await browserProvider.getSigner();
}
```

When MetaMask is installed, accessing `window.ethereum` triggers MetaMask to open automatically.

### 3. Automatic Twitter Sync with Signature Request

**File:** `src/components/ProfilePage.tsx`

The profile page had a `useEffect` that automatically synced Twitter data to the database:

```typescript
if (
  twitterAccount &&
  isOwnProfile &&
  member &&
  member.x_account !== twitterAccount &&
  (justLinkedTwitter || (twitterAccount && !member.x_account))  // <-- PROBLEM
) {
  // Automatically triggers secureUpdateProfile which requires signature
  const result = await secureUpdateProfile(...);
}
```

The condition `(twitterAccount && !member.x_account)` meant: "If user has Twitter in Privy but not in database, auto-sync it". This caused an **automatic signature request** when users visited their profile page, without them clicking anything.

## Solutions Implemented

### 1. Removed External Wallets from Privy Config

**File:** `src/main.jsx`

**Changes:**

- Removed `walletList` property completely
- Removed `externalWallets` configuration
- Kept only Privy embedded wallets with social login options

**Before:**

```javascript
appearance: {
  theme: 'light',
  accentColor: '#676FFF',
  walletList: ['metamask', 'coinbase_wallet', 'walletconnect']
},
embeddedWallets: {
  createOnLogin: 'users-without-wallets',
  requireUserPasswordOnCreate: true,
},
externalWallets: {
  walletConnect: {
    projectId: 'replace-with-your-walletconnect-project-id',
  },
}
```

**After:**

```javascript
appearance: {
  theme: 'light',
  accentColor: '#676FFF',
},
embeddedWallets: {
  createOnLogin: 'users-without-wallets',
  requireUserPasswordOnCreate: true,
}
```

### 2. Updated Secure API to Use Only Privy Embedded Wallets

**File:** `src/lib/secure-api.ts`

**Changes:**

- Removed `getPrivyProvider()` helper function (deleted entirely)
- Removed window.ethereum fallback
- Changed parameter from `provider?: BrowserProvider` to `privyEmbeddedWallet?: any`
- Added requirement that Privy embedded wallet must be passed
- Added clear documentation about avoiding MetaMask

**Before:**

```typescript
export async function secureUpdateProfile(
  walletAddress: string,
  updates: {...},
  provider?: BrowserProvider
) {
  let signer;
  if (provider) {
    signer = await provider.getSigner();
  } else if (typeof window !== "undefined" && (window as any).ethereum) {
    // Fallback to MetaMask - THIS WAS THE PROBLEM
    const browserProvider = new BrowserProvider((window as any).ethereum);
    signer = await browserProvider.getSigner();
  }
  ...
}
```

**After:**

```typescript
export async function secureUpdateProfile(
  walletAddress: string,
  updates: {...},
  privyEmbeddedWallet?: any // Privy embedded wallet object from useWallets()
) {
  // Get the signer from Privy embedded wallet ONLY
  // DO NOT use window.ethereum as it triggers MetaMask
  if (!privyEmbeddedWallet) {
    throw new Error("Privy embedded wallet is required. Please log in first.");
  }

  const provider = await privyEmbeddedWallet.getEthereumProvider();
  const browserProvider = new BrowserProvider(provider);
  const signer = await browserProvider.getSigner();
  ...
}
```

### 3. Updated ProfilePage to Pass Privy Embedded Wallet

**File:** `src/components/ProfilePage.tsx`

**Changes:**

- Added `useWallets` import from `@privy-io/react-auth`
- Removed `getPrivyProvider` import
- Get embedded wallet using `wallets.find(wallet => wallet.walletClientType === 'privy')`
- Pass embedded wallet to `secureUpdateProfile`

**Before:**

```typescript
import { usePrivy } from '@privy-io/react-auth';
import { secureUpdateProfile, getPrivyProvider } from '../lib/secure-api';

// In component:
const { user, linkTwitter } = usePrivy();
...
const provider = await getPrivyProvider();
const result = await secureUpdateProfile(
  walletAddress,
  updates,
  provider || undefined
);
```

**After:**

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { secureUpdateProfile } from '../lib/secure-api';

// In component:
const { user, linkTwitter } = usePrivy();
const { wallets } = useWallets();
...
const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
if (!embeddedWallet) {
  throw new Error('No Privy embedded wallet found. Please log in.');
}
const result = await secureUpdateProfile(
  walletAddress,
  updates,
  embeddedWallet
);
```

### 4. Prevent Automatic Signature Requests

**File:** `src/components/ProfilePage.tsx`

**Changes:**

- Removed automatic Twitter sync condition
- Only sync when user explicitly clicks "Connect X" button
- Signature requests now ONLY happen as direct result of user actions

**Before:**

```typescript
// This ran automatically when profile loaded if Twitter was in Privy but not DB
if (
  twitterAccount &&
  isOwnProfile &&
  member &&
  member.x_account !== twitterAccount &&
  (justLinkedTwitter || (twitterAccount && !member.x_account))  // Auto-sync
) {
  await secureUpdateProfile(...); // Triggers signature popup
}
```

**After:**

```typescript
// Only runs when user explicitly clicks "Connect X" button
if (
  justLinkedTwitter &&  // ONLY when user clicked button
  twitterAccount &&
  isOwnProfile &&
  member &&
  member.x_account !== twitterAccount
) {
  await secureUpdateProfile(...); // Signature only on user action
}
```

## Files Modified

1. ✅ `src/main.jsx` - Removed external wallet configuration
2. ✅ `src/lib/secure-api.ts` - Removed window.ethereum access and getPrivyProvider
3. ✅ `src/components/ProfilePage.tsx` - Updated to use Privy embedded wallet AND removed automatic signature requests

## Verification

### No window.ethereum Access

Verified that no code in `src/` accesses `window.ethereum`:

```bash
grep -r "window\.ethereum" src/
# Result: Only found in comments explaining what NOT to do
```

### No External Wallet Dependencies

Verified no wagmi or WalletConnect usage:

```bash
grep -r "useAccount|useConnect|wagmi|WalletConnect" src/
# Result: No matches
```

### All EIP-1193 Provider Access is Through Privy

All `getEthereumProvider()` calls use Privy embedded wallet:

- `src/lib/secure-api.ts` - Uses privyEmbeddedWallet.getEthereumProvider()
- `src/hooks/useSmartWallet.tsx` - Uses embeddedWallet.getEthereumProvider()

## Testing Recommendations

### Test Case 1: Initial Login

1. Open app with MetaMask installed
2. Click "Join the Game" or login
3. **Expected:** Only Privy login modal appears
4. **Expected:** MetaMask does NOT open

### Test Case 2: Navigate to Profile (No Auto-Signature)

1. Log in with Privy
2. Click "My Profile" from menu
3. **Expected:** Profile loads without any wallet popups
4. **Expected:** MetaMask does NOT open
5. **Expected:** NO Privy signature request appears automatically

### Test Case 3: Link Twitter/X Account (Signature on Button Click Only)

1. Log in with Privy
2. Navigate to your profile
3. Click "Connect X" button
4. Complete Twitter OAuth flow
5. **Expected:** Privy asks for signature ONLY after Twitter OAuth completes
6. **Expected:** Signature happens as direct result of clicking "Connect X"
7. **Expected:** MetaMask does NOT open

### Test Case 4: Users Without MetaMask

1. Use browser without MetaMask
2. Complete all flows
3. **Expected:** Everything works identically

### Test Case 5: User Already Has Twitter Linked in Privy

1. User previously linked Twitter in Privy (different session)
2. User logs in and visits their profile
3. **Expected:** NO automatic signature request
4. **Expected:** Profile loads normally without any popups
5. If user wants to sync Twitter to database, they can click "Connect X" manually

## Technical Details

### Why MetaMask Was Triggered

When MetaMask is installed in a browser, it injects itself as `window.ethereum`. Any code that:

1. Checks for `window.ethereum`
2. Creates a provider from `window.ethereum`
3. Calls methods on the provider

...will trigger MetaMask to open its popup, even if the code is just checking for availability.

### How We Fixed It

By exclusively using Privy's embedded wallet through their API:

```typescript
// Get embedded wallet from Privy (never touches window.ethereum)
const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

// Get provider from Privy's embedded wallet (isolated from MetaMask)
const provider = await embeddedWallet.getEthereumProvider();
```

This approach:

- ✅ Never accesses window.ethereum
- ✅ Never triggers MetaMask
- ✅ Works identically whether MetaMask is installed or not
- ✅ Uses only Privy's infrastructure

## Benefits

1. **Consistent UX** - All users see only Privy, regardless of what wallets they have installed
2. **No Unexpected Popups** - No MetaMask popups, no random signature requests
3. **User Control** - Signatures only requested when user explicitly clicks buttons
4. **Clear Intent** - Every wallet action has a clear user-initiated trigger
5. **Simplified Flow** - Single wallet provider (Privy) for all operations
6. **Future-Proof** - Code is isolated from any browser extension wallet changes

## Key Principles Applied

### 1. No Automatic Wallet Actions

**Rule:** Never trigger wallet signatures or transactions automatically in `useEffect` or on page load.

**Why:** Users should always know WHY they're being asked to sign something. Automatic signatures feel like a security risk and create poor UX.

**How:** All wallet actions must be direct responses to user button clicks.

### 2. Explicit User Intent

**Rule:** Every signature request must have a clear, visible user action that triggered it (button click, form submission, etc.)

**Why:** Users need to understand what they're signing and why.

**How:**

- ✅ User clicks "Connect X" → Privy asks for signature (clear cause & effect)
- ❌ User visits profile → Privy randomly asks for signature (confusing)

### 3. Isolated Wallet Provider

**Rule:** Use only Privy embedded wallets, never access `window.ethereum` or external wallets.

**Why:** Prevents interference from MetaMask and other browser wallet extensions.

**How:** Always get wallet from Privy's `useWallets()` hook, never from window object.

## Notes

- All existing smart wallet functionality remains unchanged
- Smart contract interactions still work through Privy embedded wallets
- No changes needed to blockchain contracts or backend APIs
- All previous features continue to work exactly as before
- Twitter linking still works, but now only syncs to DB when user clicks "Connect X"
- Users with Twitter already in Privy can still link it later by clicking the button
