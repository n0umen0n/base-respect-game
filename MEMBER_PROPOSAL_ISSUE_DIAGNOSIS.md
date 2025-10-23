# Member Proposal Issue - Complete Diagnosis

## Problem

When calling `becomeMember()` on the profile creation page, the `MemberJoined` event is saved in Supabase, but no `MemberProposalCreated` event appears on the Proposals page.

## Root Cause

**The deployed contract (at `0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29`) is NOT emitting the `MemberProposalCreated` event.**

### Investigation Details

1. **Transaction Analysis:**

   - User's `becomeMember` transaction: `0x7511c428368036b967a753a961c4501459e91f2f384a274e1b732a62bac2676c`
   - Block: 37206706
   - Only emitted `MemberJoined` with `autoApproved: false`
   - **Did NOT emit `MemberProposalCreated`**

2. **Contract Code (Current in Repository):**

   ```solidity:blockchain/contracts/RespectGameCore.sol
   // Lines 179-184
   emit MemberProposalCreated(
       memberProposals.length - 1,
       msg.sender,
       name,
       block.timestamp
   );
   ```

   The current contract code DOES include the event emission.

3. **Deployed Implementation:**
   - Implementation address: `0xf4D3bF46248f66F2e8DaA2F3ca72cA7Ab3752905`
   - The deployed version does NOT have the `emit MemberProposalCreated` line
   - This is an **older version** of the contract

## Additional Discovery

While investigating, I also found that the webhook handler was missing support for the `MemberRemoved` event:

- Event signature: `0x3ac963493df564de734d98633f1145d21512e282ba4c02d3c1011119bf7f2862`
- This event is emitted when `removeMember()` is called
- The webhook was failing to decode this event with "Decoded is null, skipping"

## Solutions Implemented

### 1. Added `MemberRemoved` Event Handler ✅

Updated `/api/webhook-respect-game.ts`:

- Added `MemberRemoved` event to the events list
- Created `handleMemberRemoved()` function that:
  - Deletes the member from the database
  - Cancels any pending approval proposals for that member
- Added routing for the new event

### 2. Contract Upgrade Required ⚠️

**You need to upgrade the RespectGameCore contract** to include the `MemberProposalCreated` event emission.

## How to Upgrade the Contract

### Step 1: Verify Current State

```bash
cd blockchain
npx hardhat run scripts/checkImplementation.ts --network base-mainnet
```

### Step 2: Run the Upgrade

```bash
npx hardhat run scripts/respect-game.manual-upgrade.ts --network base-mainnet
```

This will:

1. Deploy a new implementation with the updated `becomeMember` function
2. Upgrade the proxy at `0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29` to point to the new implementation
3. Preserve all existing state (members, game data, etc.)

### Step 3: Test After Upgrade

After upgrading, test with a new member:

1. Call `becomeMember()` from a new address
2. Check the transaction on BaseScan - you should see TWO events:
   - `MemberJoined` with `autoApproved: false`
   - `MemberProposalCreated` with the proposal ID
3. Check the Proposals page - the member approval proposal should appear

## What Happens After Upgrade

Once the contract is upgraded:

1. New members (after the first 10) will emit both `MemberJoined` AND `MemberProposalCreated` events
2. The webhook will process `MemberProposalCreated` and create a proposal in Supabase
3. The proposal will appear on the Proposals page with type "ApproveMember"
4. Top 6 members can approve the new member
5. After 2 approvals, the member becomes approved

## Why This Wasn't Working Before

Looking at the Vercel logs:

1. First webhook (06:58:17): This was a `MemberRemoved` event (deployer removed a member)
   - The webhook couldn't decode it (now fixed ✅)
2. Second webhook (06:59:23): User called `becomeMember()`
   - Only `MemberJoined` was emitted
   - No `MemberProposalCreated` because the deployed contract doesn't emit it

## Summary

| Issue                                | Status           | Solution                         |
| ------------------------------------ | ---------------- | -------------------------------- |
| Webhook can't decode `MemberRemoved` | ✅ Fixed         | Added event handler              |
| `MemberProposalCreated` not emitted  | ⚠️ Needs upgrade | Upgrade contract                 |
| Proposals not appearing in UI        | ⚠️ Blocked       | Will work after contract upgrade |

## Next Steps

1. ⚠️ **Upgrade the RespectGameCore contract** (required)
2. Test with a new member to confirm proposals are created
3. Monitor webhook logs to ensure all events are processing correctly

---

**Note:** The webhook fixes have been deployed. Once you upgrade the contract, the full flow will work end-to-end.
