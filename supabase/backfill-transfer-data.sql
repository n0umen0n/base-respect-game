-- Backfill transfer_recipient and transfer_amount for existing proposals
-- This is a temporary fix for proposals created before webhook was updated

-- For now, you'll need to manually fill in the values
-- Get the proposal transaction data from the blockchain and decode it

-- Example for proposal #2 (update with actual decoded values):
UPDATE proposals 
SET 
  transfer_recipient = '0xYourRecipientAddressHere',  -- Replace with actual recipient
  transfer_amount = 1000000  -- Replace with actual amount (in smallest unit)
WHERE proposal_id = 2 AND proposal_type = 'ExecuteTransactions';

-- To find the values:
-- 1. Go to blockchain explorer (basescan.org)
-- 2. Find the proposal creation transaction
-- 3. Look at the transaction data
-- 4. Decode the calldata to get recipient and amount

-- Or wait for the next proposal to be created after webhook is updated

