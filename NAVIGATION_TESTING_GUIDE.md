# Navigation Testing Guide

This guide will help you test the new navigation logic that checks Supabase (not blockchain) for profile existence and game state.

## Prerequisites

1. Ensure Supabase is set up with the respect-game schema
2. Ensure webhooks are configured to update Supabase when blockchain events occur
3. Have the app running locally or deployed

## Test Scenarios

### Scenario 1: New User Creates Profile

**Setup**: Use a new wallet address that has never created a profile

**Steps**:

1. Connect wallet
2. Navigate to Respect Game
3. Verify you see the Profile Creation page
4. Fill out the profile form (name, description, optional profile picture)
5. Click "Submit"
6. Wait for transaction to complete
7. Success modal should appear with "PROFILE CREATED!" message
8. Click "Continue" button

**Expected Result**:

- If it's **Contribution Submission Stage** and you haven't submitted:
  - → Should navigate to **Contribution Submission page**
- If it's **Ranking Stage**:
  - → Should navigate to **Profile page** (no group assigned yet)

**Verification**:

- Check browser console for: `"Check if user has a profile in Supabase"`
- Should see Supabase queries, not blockchain queries
- Navigation should happen within 2-3 seconds

---

### Scenario 2: Existing User with No Contribution (Submission Stage)

**Setup**:

- User already has a profile in Supabase
- Game is in Contribution Submission stage
- User has NOT submitted a contribution yet

**Steps**:

1. Connect wallet
2. Navigate to Respect Game

**Expected Result**:

- → Should navigate to **Contribution Submission page**

**Verification**:

- Check that page shows contribution form
- Check countdown timer to next stage
- Verify you can add/remove contributions

---

### Scenario 3: User Submitted Contribution (Submission Stage)

**Setup**:

- User has a profile
- Game is in Contribution Submission stage
- User HAS submitted a contribution

**Steps**:

1. Connect wallet
2. Navigate to Respect Game

**Expected Result**:

- → Should navigate to **Profile page**

**Verification**:

- Should see your profile info
- Should see game history
- Should NOT see contribution form

---

### Scenario 4: User in Group (Ranking Stage)

**Setup**:

- User has a profile
- Game is in Ranking stage
- User has been assigned to a group

**Steps**:

1. Connect wallet
2. Navigate to Respect Game

**Expected Result**:

- → Should navigate to **Ranking Submission page**

**Verification**:

- Should see group members listed
- Should see drag-and-drop ranking interface
- Should see contributions from group members

---

### Scenario 5: User Submits Contribution

**Setup**:

- User is on Contribution Submission page

**Steps**:

1. Add at least one contribution with a link
2. Click "Submit Contribution"
3. Wait for transaction
4. Success message appears

**Expected Result**:

- After 2-3 seconds, should navigate to **Profile page**

**Verification**:

- Contribution should be visible in profile
- Should not be able to submit again for this game

---

### Scenario 6: User Submits Ranking

**Setup**:

- User is on Ranking Submission page

**Steps**:

1. Drag members to rank them
2. Click "Submit Ranking"
3. Wait for transaction
4. Success message appears

**Expected Result**:

- After 2-3 seconds, should navigate to **Profile page**

**Verification**:

- Ranking should be recorded
- Should not be able to rank again for this game

---

## Edge Cases to Test

### Edge Case 1: Banned User

**Setup**: User has been banned

**Expected**: Should always show Profile page, regardless of game stage

---

### Edge Case 2: Unapproved User

**Setup**: User created profile but not yet approved by community

**Expected**: Should always show Profile page, cannot participate until approved

---

### Edge Case 3: Webhook Delay

**Setup**: After creating profile, webhook takes longer than 2 seconds

**Expected**:

- May initially show Profile Creation again
- Should auto-update once webhook processes
- Or refresh page to see correct view

**Note**: If this happens frequently, increase the delay in `handleProfileCreated()` from 2000ms to 3000ms or 4000ms

---

## Debugging

### Check Supabase Queries

Open browser DevTools Console and look for:

```
"Check if user has a profile in Supabase (NOT blockchain)"
"Error determining view:" (if there's an issue)
```

### Verify Supabase Data

Check your Supabase dashboard:

1. **Members table**: Does user exist?

   ```sql
   SELECT * FROM members WHERE wallet_address = 'YOUR_ADDRESS';
   ```

2. **Game stages**: What's current stage?

   ```sql
   SELECT * FROM game_stages;
   ```

3. **Contributions**: Has user submitted?

   ```sql
   SELECT * FROM contributions
   WHERE contributor_address = 'YOUR_ADDRESS'
   AND game_number = CURRENT_GAME_NUMBER;
   ```

4. **Groups**: Is user in a group?
   ```sql
   SELECT * FROM groups
   WHERE 'YOUR_ADDRESS' = ANY(members)
   AND game_number = CURRENT_GAME_NUMBER;
   ```

### Common Issues

**Issue**: Always shows Profile Creation even after creating profile

**Solution**:

- Check webhook is running and processing events
- Check Supabase connection credentials
- Verify `members` table has row for wallet address
- Increase delay in `handleProfileCreated()` to 3000ms

---

**Issue**: Navigation doesn't happen after clicking Continue

**Solution**:

- Check browser console for errors
- Verify `onSuccess` callback is connected properly
- Check Supabase queries are returning data

---

**Issue**: Wrong page shown after submission

**Solution**:

- Verify game stage in Supabase matches reality
- Check contribution/group data in Supabase
- Ensure webhooks are processing events correctly

---

## Success Criteria

✅ New users see appropriate page after creating profile
✅ All checks query Supabase, not blockchain
✅ Navigation happens automatically (no manual refresh needed)
✅ Edge cases (banned, unapproved) handled correctly
✅ Game stage transitions work smoothly
✅ No linting or TypeScript errors
✅ Performance is fast (< 3 seconds total)

## Performance Benchmarks

- Profile creation to navigation: **2-5 seconds**

  - Blockchain transaction: 1-3s
  - Webhook processing: 0.5-2s
  - Delay buffer: 2s
  - Supabase query + navigation: < 1s

- Contribution submission to navigation: **2-4 seconds**
- Ranking submission to navigation: **2-4 seconds**
- Page load to correct view: **< 1 second**

## Next Steps After Testing

If all tests pass:

1. ✅ Mark implementation as complete
2. ✅ Update main README with navigation details
3. ✅ Deploy to production
4. ✅ Monitor webhook performance
5. ✅ Adjust delays if needed based on real-world performance

If issues found:

1. Document the specific scenario
2. Check error logs in browser console
3. Verify Supabase data
4. Check webhook processing
5. Adjust delays or add retry logic as needed
