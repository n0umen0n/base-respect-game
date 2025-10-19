-- ============================================
-- Fix BigInt Overflow for Token Amounts
-- ============================================
-- Changes BIGINT columns to NUMERIC to handle large token amounts
-- RESPECT tokens use 18 decimals, resulting in values like:
-- 210,000 tokens = 210,000,000,000,000,000,000,000 wei
-- This exceeds PostgreSQL BIGINT max (~9.2 × 10^18)
-- ============================================

-- Step 1: Drop views that depend on these columns
DROP VIEW IF EXISTS top_six_members;
DROP VIEW IF EXISTS current_game_contributions;
DROP VIEW IF EXISTS live_proposals;
DROP VIEW IF EXISTS historical_proposals;
DROP VIEW IF EXISTS member_profiles;

-- Step 2: Alter column types
ALTER TABLE members 
  ALTER COLUMN total_respect_earned TYPE NUMERIC USING total_respect_earned::numeric,
  ALTER COLUMN average_respect TYPE NUMERIC USING average_respect::numeric;

ALTER TABLE game_results 
  ALTER COLUMN respect_earned TYPE NUMERIC USING respect_earned::numeric;

ALTER TABLE respect_history 
  ALTER COLUMN respect_amount TYPE NUMERIC USING respect_amount::numeric;

-- Step 3: Recreate views
CREATE OR REPLACE VIEW top_six_members AS
SELECT 
  m.wallet_address,
  m.name,
  m.profile_url,
  m.x_account,
  m.x_verified,
  m.average_respect,
  m.total_respect_earned,
  ROW_NUMBER() OVER (ORDER BY m.average_respect DESC, m.total_respect_earned DESC) as rank
FROM members m
WHERE m.is_approved = true AND m.is_banned = false
ORDER BY m.average_respect DESC, m.total_respect_earned DESC
LIMIT 6;

CREATE OR REPLACE VIEW current_game_contributions AS
SELECT 
  c.contributor_address,
  m.name,
  m.profile_url,
  m.x_account,
  c.game_number,
  c.contributions,
  c.links,
  c.created_at
FROM contributions c
JOIN members m ON c.contributor_address = m.wallet_address
JOIN game_stages gs ON c.game_number = gs.current_game_number;

CREATE OR REPLACE VIEW live_proposals AS
SELECT 
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
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

CREATE OR REPLACE VIEW historical_proposals AS
SELECT 
  p.proposal_id,
  p.proposal_type,
  p.proposer_address,
  m.name as proposer_name,
  p.target_member_address,
  tm.name as target_member_name,
  p.description,
  p.status,
  p.votes_for,
  p.votes_against,
  p.block_timestamp,
  p.created_at
FROM proposals p
JOIN members m ON p.proposer_address = m.wallet_address
LEFT JOIN members tm ON p.target_member_address = tm.wallet_address
WHERE p.status = 'Executed'
ORDER BY p.created_at DESC;

CREATE OR REPLACE VIEW member_profiles AS
SELECT 
  m.wallet_address,
  m.privy_did,
  m.name,
  m.profile_url,
  m.description,
  m.x_account,
  m.x_verified,
  m.is_approved,
  m.is_banned,
  m.joined_at,
  m.total_respect_earned,
  m.average_respect,
  COUNT(DISTINCT gr.game_number) as games_participated,
  COUNT(DISTINCT ma.approver_address) as vouched_by_count
FROM members m
LEFT JOIN game_results gr ON m.wallet_address = gr.member_address
LEFT JOIN member_approvals ma ON m.wallet_address = ma.approved_member_address
GROUP BY m.wallet_address, m.privy_did, m.name, m.profile_url, m.description, 
         m.x_account, m.x_verified, m.is_approved, m.is_banned, m.joined_at, 
         m.total_respect_earned, m.average_respect;

-- Step 4: Verify changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('members', 'game_results', 'respect_history')
  AND column_name IN ('total_respect_earned', 'average_respect', 'respect_earned', 'respect_amount')
ORDER BY table_name, column_name;

