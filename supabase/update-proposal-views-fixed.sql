-- Drop and recreate views to include transfer_amount and transfer_recipient

-- Drop existing views first
DROP VIEW IF EXISTS live_proposals;
DROP VIEW IF EXISTS historical_proposals;

-- Recreate live_proposals view with new columns
CREATE VIEW live_proposals AS
SELECT 
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
  p.transfer_amount,
  p.transfer_recipient,
  p.description,
  p.status,
  p.votes_for,
  p.votes_against,
  p.block_timestamp,
  p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status = 'Pending'
ORDER BY p.created_at DESC;

-- Recreate historical_proposals view with new columns
CREATE VIEW historical_proposals AS
SELECT 
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
  p.transfer_amount,
  p.transfer_recipient,
  p.description,
  p.status,
  p.votes_for,
  p.votes_against,
  p.block_timestamp,
  p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status != 'Pending'
ORDER BY p.created_at DESC;

