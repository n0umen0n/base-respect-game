# Ranking Stage Loading Issue - Fixed

## Problem

When logging in during the ranking submission stage, the game page kept loading indefinitely. The console showed a 406 HTTP error when trying to fetch rankings from Supabase.

## Root Cause

There were two issues causing the infinite loading:

1. **406 Error from Supabase**: Using `.single()` in Supabase queries expects exactly 1 row and throws a 406 error when 0 rows exist. During the ranking stage, users who haven't submitted rankings yet naturally have 0 rows, causing the query to fail.

2. **childLoading State Not Reset**: After `determineView()` completed, it set `loading = false` but forgot to set `childLoading = false`, causing the loading overlay to remain visible even though the view was determined.

## Solution

Changed all `.single()` calls to `.maybeSingle()` in the Supabase helper functions:

### Files Modified

1. **`src/lib/supabase-respect.ts`**

   - `getMember()` - Changed to `maybeSingle()`
   - `getCurrentGameStage()` - Changed to `maybeSingle()`
   - `getMemberContribution()` - Changed to `maybeSingle()`
   - `getMemberGroup()` - Changed to `maybeSingle()` (2 instances)
   - `getMemberRanking()` - Changed to `maybeSingle()`
   - `getMemberProfile()` - Changed to `maybeSingle()`
   - `updateMemberXAccount()` - Changed to `maybeSingle()`
   - `getMemberGameHistory()` - Changed to `maybeSingle()` (2 instances in nested queries)

2. **`src/components/RespectGameContainer.tsx`**

   - **Critical Fix**: Added `setChildLoading(false)` after `determineView()` completes (lines 211 & 217)
   - Added logging to track which view is determined
   - Fixed ProposalsPage props (changed `userAddress` to `isLoggedIn`)

3. **`supabase/verify-rls-policies.sql`** (New file)
   - Script to verify and clean up any duplicate RLS policies

## Difference Between `.single()` and `.maybeSingle()`

- **`.single()`**: Expects exactly 1 row, throws error if 0 or 2+ rows exist
- **`.maybeSingle()`**: Expects 0 or 1 rows, returns `null` if 0 rows, no error thrown

## Optional: Clean Up Duplicate Policies

If you added a duplicate policy to the rankings table, you can run the SQL script to clean it up:

```bash
# In Supabase SQL Editor, run:
supabase/verify-rls-policies.sql
```

This will:

1. Show all policies on the rankings table
2. Remove any duplicate policies
3. Ensure the correct policy exists
4. Verify RLS is enabled

## Testing

1. Start the dev server: `npm run dev`
2. Log in to your account
3. Navigate to `/game` during ranking submission stage
4. The ranking submission form should load without errors
5. If you haven't been assigned to a group yet, it should show your profile instead

## Expected Behavior

- **No ranking submitted + Has group**: Shows ranking submission form
- **No ranking submitted + No group assigned**: Shows profile page
- **Ranking already submitted**: Shows profile page
- **Not approved member**: Shows profile page

## Status

✅ Fixed - The game page now loads correctly during ranking stage without 406 errors.
