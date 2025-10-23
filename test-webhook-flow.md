# Webhook Test Plan

## Prerequisites Checklist:

- [ ] Smart contract upgraded with new approval logic
- [ ] Vercel deployed with API route fix (vercel.json excludes /api/\*)
- [ ] Alchemy webhook URL updated to: https://www.respectgame.app/api/webhook-respect-game

## Test Steps:

### Option 1: Real User Test (Recommended)

1. Have a new user (not already a member) call `becomeMember()`
2. Watch for events in Alchemy
3. Check Vercel logs for webhook processing
4. Verify proposal appears on proposals page

### Option 2: Manual Test Script

Run the test script with a fresh wallet

## Expected Flow:

1. User calls `becomeMember()` on smart contract
2. Contract emits:
   - `MemberJoined` event
   - `MemberProposalCreated` event
3. Alchemy catches both events
4. Webhook receives POST request
5. Processes `MemberJoined` → Inserts member to DB
6. Processes `MemberProposalCreated` → Waits for member → Creates proposal
7. Proposal appears on frontend with ID 1000000+

## What to Monitor:

- Alchemy webhook: Successful POST with 200 response
- Vercel logs: See "Member joined" and "Member proposal created"
- Database: New member + new proposal
- Frontend: Proposal visible on proposals page
