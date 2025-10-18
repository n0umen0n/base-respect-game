-- ============================================
-- Respect Game Database Schema
-- ============================================
-- Complete schema for Respect Game with all features
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEMBERS TABLE
-- ============================================
-- SECURITY NOTE: x_account is NOT stored on-chain for security reasons
-- X accounts are only stored in the database after Privy OAuth verification
-- This prevents anyone from claiming X accounts they don't own
-- See X_ACCOUNT_SECURITY.md for full security explanation
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(66) UNIQUE NOT NULL,
  privy_did VARCHAR,  -- Links to Privy user who authenticated
  name VARCHAR(100) NOT NULL,
  profile_url VARCHAR(500),
  description TEXT,
  x_account VARCHAR(100),  -- ONLY set via Privy OAuth, NOT from blockchain events
  x_verified BOOLEAN DEFAULT false,  -- X verified status from OAuth
  is_approved BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_respect_earned BIGINT DEFAULT 0,
  average_respect BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_wallet ON members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_members_approved ON members(is_approved);
CREATE INDEX IF NOT EXISTS idx_members_average_respect ON members(average_respect DESC);

-- ============================================
-- GAME_STAGES TABLE
-- Track current game state
-- ============================================
CREATE TABLE IF NOT EXISTS game_stages (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row table
  current_game_number INTEGER NOT NULL DEFAULT 1,
  current_stage VARCHAR(50) NOT NULL DEFAULT 'ContributionSubmission', -- 'ContributionSubmission' or 'ContributionRanking'
  next_stage_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize with default row
INSERT INTO game_stages (id, current_game_number, current_stage, next_stage_timestamp) 
VALUES (1, 1, 'ContributionSubmission', NOW() + INTERVAL '7 days') 
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_address VARCHAR(66) NOT NULL,
  game_number INTEGER NOT NULL,
  contributions TEXT[] NOT NULL, -- Array of contribution texts
  links TEXT[] NOT NULL, -- Array of links
  counted BOOLEAN DEFAULT false,
  tx_hash VARCHAR(66),
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (contributor_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(contributor_address, game_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contributions_game ON contributions(game_number);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor_address);

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_number INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  members TEXT[] NOT NULL, -- Array of wallet addresses
  finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_number, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groups_game ON groups(game_number);

-- ============================================
-- MEMBER_GROUPS TABLE
-- Maps members to their group in each game
-- ============================================
CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_number INTEGER NOT NULL,
  member_address VARCHAR(66) NOT NULL,
  group_id INTEGER NOT NULL,
  FOREIGN KEY (member_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(game_number, member_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_groups_game ON member_groups(game_number);
CREATE INDEX IF NOT EXISTS idx_member_groups_member ON member_groups(member_address);

-- ============================================
-- RANKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ranker_address VARCHAR(66) NOT NULL,
  game_number INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  ranked_addresses TEXT[] NOT NULL, -- Array of addresses in rank order
  tx_hash VARCHAR(66),
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (ranker_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(ranker_address, game_number, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rankings_game ON rankings(game_number);
CREATE INDEX IF NOT EXISTS idx_rankings_group ON rankings(game_number, group_id);
CREATE INDEX IF NOT EXISTS idx_rankings_ranker ON rankings(ranker_address);

-- ============================================
-- GAME_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_address VARCHAR(66) NOT NULL,
  game_number INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  respect_earned BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(member_address, game_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_results_member ON game_results(member_address);
CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results(game_number);

-- ============================================
-- PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id INTEGER UNIQUE NOT NULL,
  proposal_type VARCHAR(50) NOT NULL, -- 'BanMember', 'ApproveMember', 'ExecuteTransactions'
  proposer_address VARCHAR(66) NOT NULL,
  target_member_address VARCHAR(66),
  transfer_amount BIGINT,
  transfer_recipient VARCHAR(66),
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Executed'
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  tx_hash VARCHAR(66),
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (proposer_address) REFERENCES members(wallet_address) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_type ON proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON proposals(proposer_address);

-- ============================================
-- PROPOSAL_VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id INTEGER NOT NULL,
  voter_address VARCHAR(66) NOT NULL,
  vote_for BOOLEAN NOT NULL,
  tx_hash VARCHAR(66),
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (voter_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(proposal_id, voter_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_voter ON proposal_votes(voter_address);

-- ============================================
-- MEMBER_APPROVALS TABLE
-- Track who vouched for whom
-- ============================================
CREATE TABLE IF NOT EXISTS member_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approved_member_address VARCHAR(66) NOT NULL,
  approver_address VARCHAR(66) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (approved_member_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  FOREIGN KEY (approver_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(approved_member_address, approver_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_approvals_approved ON member_approvals(approved_member_address);
CREATE INDEX IF NOT EXISTS idx_member_approvals_approver ON member_approvals(approver_address);

-- ============================================
-- RESPECT_HISTORY TABLE
-- Track respect earned each game
-- ============================================
CREATE TABLE IF NOT EXISTS respect_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_address VARCHAR(66) NOT NULL,
  game_number INTEGER NOT NULL,
  respect_amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_address) REFERENCES members(wallet_address) ON DELETE CASCADE,
  UNIQUE(member_address, game_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_respect_history_member ON respect_history(member_address);
CREATE INDEX IF NOT EXISTS idx_respect_history_game ON respect_history(game_number);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update members updated_at timestamp
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update game_stages updated_at timestamp
DROP TRIGGER IF EXISTS update_game_stages_updated_at ON game_stages;
CREATE TRIGGER update_game_stages_updated_at
  BEFORE UPDATE ON game_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE respect_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (prevents "already exists" error)
DROP POLICY IF EXISTS "Anyone can view members" ON members;
DROP POLICY IF EXISTS "Anyone can view game_stages" ON game_stages;
DROP POLICY IF EXISTS "Anyone can view contributions" ON contributions;
DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
DROP POLICY IF EXISTS "Anyone can view member_groups" ON member_groups;
DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
DROP POLICY IF EXISTS "Anyone can view game_results" ON game_results;
DROP POLICY IF EXISTS "Anyone can view proposals" ON proposals;
DROP POLICY IF EXISTS "Anyone can view proposal_votes" ON proposal_votes;
DROP POLICY IF EXISTS "Anyone can view member_approvals" ON member_approvals;
DROP POLICY IF EXISTS "Anyone can view respect_history" ON respect_history;

DROP POLICY IF EXISTS "Service role can insert members" ON members;
DROP POLICY IF EXISTS "Service role can update members" ON members;
DROP POLICY IF EXISTS "Service role can update game_stages" ON game_stages;
DROP POLICY IF EXISTS "Service role can insert contributions" ON contributions;
DROP POLICY IF EXISTS "Service role can insert groups" ON groups;
DROP POLICY IF EXISTS "Service role can insert member_groups" ON member_groups;
DROP POLICY IF EXISTS "Service role can insert rankings" ON rankings;
DROP POLICY IF EXISTS "Service role can insert game_results" ON game_results;
DROP POLICY IF EXISTS "Service role can insert proposals" ON proposals;
DROP POLICY IF EXISTS "Service role can update proposals" ON proposals;
DROP POLICY IF EXISTS "Service role can insert proposal_votes" ON proposal_votes;
DROP POLICY IF EXISTS "Allow X account updates" ON members;

-- Public read access policies
CREATE POLICY "Anyone can view members" ON members FOR SELECT USING (true);
CREATE POLICY "Anyone can view game_stages" ON game_stages FOR SELECT USING (true);
CREATE POLICY "Anyone can view contributions" ON contributions FOR SELECT USING (true);
CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view member_groups" ON member_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view rankings" ON rankings FOR SELECT USING (true);
CREATE POLICY "Anyone can view game_results" ON game_results FOR SELECT USING (true);
CREATE POLICY "Anyone can view proposals" ON proposals FOR SELECT USING (true);
CREATE POLICY "Anyone can view proposal_votes" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can view member_approvals" ON member_approvals FOR SELECT USING (true);
CREATE POLICY "Anyone can view respect_history" ON respect_history FOR SELECT USING (true);

-- Service role can insert/update (via webhooks)
CREATE POLICY "Service role can insert members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update members" ON members FOR UPDATE WITH CHECK (true);
CREATE POLICY "Service role can update game_stages" ON game_stages FOR UPDATE WITH CHECK (true);
CREATE POLICY "Service role can insert contributions" ON contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert member_groups" ON member_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert rankings" ON rankings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert game_results" ON game_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert proposals" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update proposals" ON proposals FOR UPDATE WITH CHECK (true);
CREATE POLICY "Service role can insert proposal_votes" ON proposal_votes FOR INSERT WITH CHECK (true);

-- Allow X account updates after Privy Twitter authentication
-- This policy allows the frontend to update X account info after OAuth verification
CREATE POLICY "Allow X account updates" ON members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service role can insert member_approvals" ON member_approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert respect_history" ON respect_history FOR INSERT WITH CHECK (true);

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- Top 6 members view
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

-- Member contributions for current game
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

-- Live proposals view
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

-- Historical proposals view
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

-- Member profile view with all data
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

-- ============================================
-- COMPLETE!
-- ============================================

