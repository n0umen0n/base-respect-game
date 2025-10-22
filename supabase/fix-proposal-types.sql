-- Fix existing proposals that have "Unknown" type
-- These should be ExecuteTransactions (transfer proposals)

-- First, let's see what we have
SELECT proposal_id, proposal_type, description, status 
FROM proposals 
ORDER BY created_at DESC;

-- Update proposals with type "Unknown" to "ExecuteTransactions"
-- This assumes all Unknown proposals are transfer proposals
UPDATE proposals 
SET proposal_type = 'ExecuteTransactions'
WHERE proposal_type = 'Unknown';

-- Verify the update
SELECT proposal_id, proposal_type, description, status 
FROM proposals 
ORDER BY created_at DESC;

