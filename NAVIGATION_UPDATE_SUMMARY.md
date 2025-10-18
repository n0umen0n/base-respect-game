# Navigation Update Summary

## Changes Made

Updated the `RespectGameContainer` component to check **Supabase** (not blockchain) for profile existence and game state, then navigate users to the appropriate page.

## Key Changes

### 1. Profile Verification Now Uses Supabase

**Before**: Checked `memberInfo` from blockchain via `useRespectGame` hook
**After**: Checks Supabase directly using `getMember(smartAccountAddress)`

```typescript
// Old approach (blockchain)
if (!memberInfo?.exists) {
  setCurrentView("profile-creation");
}

// New approach (Supabase)
const memberData = await getMember(smartAccountAddress);
if (!memberData) {
  setCurrentView("profile-creation");
}
```

### 2. Game Stage Check Uses Supabase

**Before**: Used `gameState.currentStage` from blockchain
**After**: Uses `getCurrentGameStage()` from Supabase

```typescript
// Get current game stage from Supabase
const gameStageData = await getCurrentGameStage();
const { current_game_number, current_stage, next_stage_timestamp } =
  gameStageData;
```

### 3. Navigation Logic

After user creates profile and clicks "Continue":

#### Contribution Submission Stage

- ✅ **Has profile + NO contribution** → Navigate to Contribution Submission page
- ✅ **Has profile + HAS contribution** → Navigate to Profile page

#### Ranking Stage

- ✅ **Has profile + HAS group** → Navigate to Ranking Submission page
- ✅ **Has profile + NO group** → Navigate to Profile page

#### Special Cases

- ✅ **No profile** → Profile Creation page
- ✅ **Banned** → Profile page
- ✅ **Not approved** → Profile page

## Files Modified

### `src/components/RespectGameContainer.tsx`

1. **Added explicit React import**:

   ```typescript
   import React, { useState, useEffect } from "react";
   ```

2. **Added Supabase game data state**:

   ```typescript
   const [supabaseGameData, setSupabaseGameData] = useState<{
     gameNumber: number;
     stage: string;
     nextStageTimestamp: Date;
   } | null>(null);
   ```

3. **Updated `determineView()` function**:

   - Now checks Supabase for member existence
   - Gets game stage from Supabase
   - Checks contribution status from Supabase
   - Checks group assignment from Supabase
   - All navigation decisions based on Supabase data

4. **Added webhook delay handling**:

   - `handleProfileCreated()`: Waits 2 seconds for webhook to process
   - `handleContributionSubmitted()`: Waits 2 seconds for webhook to process
   - `handleRankingSubmitted()`: Waits 2 seconds for webhook to process
   - This ensures Supabase is updated before navigation

5. **Updated component rendering**:

   - `ContributionSubmission` and `RankingSubmission` now use `supabaseGameData` instead of `gameState`

6. **Improved navigation after submissions**:
   - All submission handlers now call `determineView()` to navigate to the appropriate page
   - This ensures users see the correct page based on current game state after any action

## How It Works

### Flow After Profile Creation

1. User fills out profile form
2. Clicks "Submit" → Calls `becomeMember()` on smart contract
3. Success modal appears with "Continue" button
4. User clicks "Continue" → Calls `handleSuccessModalClose()`
5. `handleSuccessModalClose()` calls `onSuccess()` callback
6. `onSuccess` maps to `handleProfileCreated()` in container
7. `handleProfileCreated()` calls:
   - `refreshData()` - Updates blockchain state
   - `determineView()` - Checks Supabase and navigates

### Navigation Decision Tree

```
User clicks Continue
    ↓
Check Supabase for profile
    ↓
No profile? → Profile Creation page
    ↓
Has profile → Check approval status
    ↓
Banned/Not approved? → Profile page
    ↓
Approved → Check game stage (Supabase)
    ↓
Contribution Stage?
    ↓
    ├─ No contribution → Contribution Submission page ✅
    └─ Has contribution → Profile page
    ↓
Ranking Stage?
    ↓
    ├─ Has group → Ranking Submission page ✅
    └─ No group → Profile page
```

## Testing Checklist

- [ ] New user creates profile → sees appropriate next page
- [ ] User with profile but no contribution in submission stage → sees contribution page
- [ ] User with contribution in submission stage → sees profile page
- [ ] User with group in ranking stage → sees ranking page
- [ ] User without group in ranking stage → sees profile page
- [ ] Banned user → sees profile page
- [ ] Unapproved user → sees profile page

## Benefits

1. **Faster**: Supabase queries are faster than blockchain reads
2. **Real-time**: Webhook updates Supabase immediately after blockchain events
3. **Reliable**: No dependency on blockchain node availability
4. **Scalable**: Database queries scale better than repeated blockchain reads
5. **Consistent**: All data comes from single source (Supabase)

## Notes

- The blockchain state is still used for displaying RESPECT balance and top member status
- Contract write operations (becomeMember, submitContribution, submitRanking) still go to blockchain
- Webhooks ensure Supabase stays in sync with blockchain
