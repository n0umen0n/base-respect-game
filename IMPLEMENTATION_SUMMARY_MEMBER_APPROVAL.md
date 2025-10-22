# Member Approval System Implementation Summary

## Overview

Successfully implemented a new member approval system where the top 6 members can approve new members, replacing the previous governance-based approval system.

## Changes Made

### 1. Smart Contracts

#### RespectGameStorage.sol

- Added `memberApprovers` mapping to track which top members have approved each candidate
- Added `hasApprovedMember` mapping to track if a specific top member has approved a candidate
- Reduced storage gap from 48 to 46 to accommodate new state variables

#### RespectGameCore.sol

- **Modified `approveMemberByGovernance` function:**
  - Changed from `onlyGovernance` modifier to requiring top 6 member status
  - Implemented approval tracking system
  - Requires 2 approvals from top 6 members to approve a new member
  - Added `MemberApprovalVoted` event emission for each approval vote
  - Automatically approves member when threshold (2 approvals) is reached

#### IRespectGameCore.sol

- Added new event: `MemberApprovalVoted(address indexed candidate, address indexed approver, uint256 timestamp)`

### 2. Frontend Changes

#### src/lib/supabase-respect.ts

- **Modified `getAllMembers` function:**
  - Now fetches ALL non-banned members (including non-approved)
  - Added `is_approved` field to the query
  - Removed filter for `is_approved = true`
- **Updated `TopSixMember` interface:**
  - Added optional `is_approved` field

#### src/hooks/useRespectGame.tsx

- **Added `approveMemberByGovernance` to ABI**
- **Created new `approveMember` function:**
  - Calls `approveMemberByGovernance` on the Core contract
  - Takes member address as parameter
  - Returns transaction hash
- **Fixed type issues:**
  - Added type casting for `userAddress` parameters in contract calls

#### src/components/ProposalsPage.tsx

- **Updated voting dialog state:**
  - Added `isApproveMember` boolean flag
  - Added `targetMemberAddress` optional field
- **Modified `ProposalCard` component:**
  - Updated to detect ApproveMember proposals
  - Only shows "FOR" button for ApproveMember proposals (no "AGAINST" button)
  - Passes proposal type info to vote handler
- **Updated `handleVoteClick` function:**
  - Now accepts additional parameters for member approval
- **Modified `handleVoteConfirm` function:**
  - Detects if proposal is ApproveMember type
  - Calls `approveMember` instead of `voteOnProposal` for member approvals
  - Updated dialog text to show "approve this member" for approval proposals

### 3. Webhook Changes

#### api/webhook-respect-game.ts

- **Added new event signatures:**
  - `MemberProposalCreated`
  - `MemberApprovalVoted`
- **Created `handleMemberProposalCreated` function:**
  - Processes `MemberProposalCreated` events
  - Creates a proposal record in Supabase with type "ApproveMember"
  - Sets candidate as both proposer and target member
- **Created `handleMemberApprovalVoted` function:**
  - Processes `MemberApprovalVoted` events
  - Records votes in `proposal_votes` table
  - Updates vote count on the proposal
- **Updated `handleMemberApproved` function:**
  - Now also marks corresponding proposal as "Executed"
- **Updated event router:**
  - Added routing for new events

## Key Features

### 1. Non-Approved Members in Leaderboard

- All non-banned members now appear in the leaderboard, regardless of approval status
- This allows the community to see pending members

### 2. Automatic Proposal Creation

- When a user calls `becomeMember` after the initial free spots are filled
- A `MemberProposalCreated` event is emitted
- Webhook automatically creates a proposal in the database
- Proposal appears on the proposals page

### 3. Top 6 Member Approval

- Only top 6 members can approve new members
- No "AGAINST" votes for member approvals (only approve or abstain)
- Requires 2 approvals to accept a new member
- Each approval is tracked separately in the smart contract
- UI remains consistent - top 6 members click the same "FOR" button

### 4. Transparent Voting

- Each approval vote emits a `MemberApprovalVoted` event
- Votes are tracked in the database
- Vote counts display on proposals page
- When 2 approvals reached, member is auto-approved

## Technical Details

### Approval Flow

1. User calls `becomeMember` → Creates unapproved member + emits `MemberProposalCreated`
2. Webhook catches event → Creates "ApproveMember" proposal in database
3. Top 6 member views proposal → Clicks "FOR" button
4. Frontend calls `approveMemberByGovernance` → Emits `MemberApprovalVoted`
5. After 2 approvals → Member automatically approved → Emits `MemberApproved`
6. Webhook updates member and proposal status in database

### Data Flow

```
Smart Contract → Alchemy Webhook → Supabase Database → Frontend
```

### Security Considerations

- `approveMemberByGovernance` checks `isTopMember(msg.sender)`
- Prevents double-voting with `hasApprovedMember` mapping
- Only processes non-executed proposals
- Transaction will revert if non-top-member tries to call

## Files Modified

### Smart Contracts

- `blockchain/contracts/storage/RespectGameStorage.sol`
- `blockchain/contracts/RespectGameCore.sol`
- `blockchain/contracts/interfaces/IRespectGameCore.sol`

### Frontend

- `src/lib/supabase-respect.ts`
- `src/hooks/useRespectGame.tsx`
- `src/components/ProposalsPage.tsx`

### Backend

- `api/webhook-respect-game.ts`

## Testing Recommendations

1. **Test non-approved member visibility:**

   - Create a new member (should be unapproved after initial spots filled)
   - Verify they appear in leaderboard
   - Verify `is_approved` field displays correctly

2. **Test proposal creation:**

   - Call `becomeMember` as a new user
   - Verify proposal appears on proposals page
   - Check webhook logs for `MemberProposalCreated` event

3. **Test approval voting:**

   - As a top 6 member, click "FOR" on a member proposal
   - Verify vote count increases
   - Check that same member cannot vote twice
   - Verify `MemberApprovalVoted` event is emitted

4. **Test auto-approval:**

   - Have 2 different top 6 members approve same candidate
   - Verify member becomes approved after 2nd vote
   - Verify proposal status changes to "Executed"
   - Check `MemberApproved` event is emitted

5. **Test access control:**
   - Try calling `approveMemberByGovernance` as non-top-member
   - Verify transaction reverts with "Not top member" error

## Deployment Notes

1. **Smart Contract Upgrade Required:**

   - Deploy updated RespectGameCore contract
   - Ensure storage layout is compatible (we maintained storage ordering)

2. **No Database Migration Needed:**

   - Existing proposals table schema works for ApproveMember proposals
   - Webhook automatically handles new events

3. **Frontend Deployment:**
   - No breaking changes
   - Backwards compatible with existing proposals
   - Deploy frontend after contract upgrade

## Next Steps

- Test on testnet thoroughly
- Upgrade smart contracts on mainnet
- Deploy frontend updates
- Monitor webhook logs for proper event handling
- Verify approval flow with real users
