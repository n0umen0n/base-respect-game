-- ============================================
-- SECURE ROW LEVEL SECURITY POLICIES
-- ============================================
-- This file locks down the database so that:
-- 1. Frontend (anon key) can only READ
-- 2. Backend (service_role key) can WRITE
-- 3. No user can modify data directly from frontend
-- ============================================

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;

-- Members table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view members" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Users can update own x_account" ON members;

-- Transactions table policies
DROP POLICY IF EXISTS "Anyone can view transactions" ON transactions;
DROP POLICY IF EXISTS "Only service role can insert transactions" ON transactions;

-- Leaderboard table policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;

-- Achievements table policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;

-- Global stats table policies
DROP POLICY IF EXISTS "Anyone can view global stats" ON global_stats;

-- Contributions table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view contributions" ON contributions;
DROP POLICY IF EXISTS "Service role can manage contributions" ON contributions;

-- Rankings table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
DROP POLICY IF EXISTS "Allow public read access to rankings" ON rankings;
DROP POLICY IF EXISTS "Service role can manage rankings" ON rankings;

-- Groups table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
DROP POLICY IF EXISTS "Service role can manage groups" ON groups;

-- Member groups table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view member_groups" ON member_groups;
DROP POLICY IF EXISTS "Service role can manage member_groups" ON member_groups;

-- Game results table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view game_results" ON game_results;
DROP POLICY IF EXISTS "Service role can manage game_results" ON game_results;

-- Game stages table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view game_stages" ON game_stages;
DROP POLICY IF EXISTS "Service role can manage game_stages" ON game_stages;

-- Respect history table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view respect_history" ON respect_history;
DROP POLICY IF EXISTS "Service role can manage respect_history" ON respect_history;

-- Proposals table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view proposals" ON proposals;
DROP POLICY IF EXISTS "Service role can manage proposals" ON proposals;

-- Proposal votes table policies (Respect Game)
DROP POLICY IF EXISTS "Anyone can view proposal_votes" ON proposal_votes;
DROP POLICY IF EXISTS "Service role can manage proposal_votes" ON proposal_votes;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Original tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- Respect Game tables
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS respect_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE SECURE READ-ONLY POLICIES FOR ANON KEY
-- ============================================

-- Original tables - READ ONLY
CREATE POLICY "Allow public read access to users" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to transactions" 
  ON transactions FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to leaderboard" 
  ON leaderboard FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to achievements" 
  ON achievements FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to global_stats" 
  ON global_stats FOR SELECT 
  USING (true);

-- Respect Game tables - READ ONLY
CREATE POLICY "Allow public read access to members" 
  ON members FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to contributions" 
  ON contributions FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to rankings" 
  ON rankings FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to groups" 
  ON groups FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to member_groups" 
  ON member_groups FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to game_results" 
  ON game_results FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to game_stages" 
  ON game_stages FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to respect_history" 
  ON respect_history FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to proposals" 
  ON proposals FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to proposal_votes" 
  ON proposal_votes FOR SELECT 
  USING (true);

-- ============================================
-- NO INSERT/UPDATE/DELETE POLICIES FOR ANON KEY
-- ============================================
-- The absence of INSERT/UPDATE/DELETE policies means:
-- - Anonymous users (anon key) CANNOT write to any table
-- - Only service_role key (backend) can write
-- - This prevents frontend tampering completely

-- ============================================
-- VERIFY SECURITY
-- ============================================

-- To test security, run these queries:
-- 1. As anon user: SELECT * FROM users; -- Should work
-- 2. As anon user: UPDATE users SET username='hacked' WHERE wallet_address='0x...'; -- Should FAIL with RLS error
-- 3. As anon user: INSERT INTO users (...) VALUES (...); -- Should FAIL with RLS error

-- ============================================
-- COMPLETE!
-- ============================================
-- Your database is now secure!
-- - Frontend can only READ data
-- - Only backend (service_role key) can WRITE
-- - All writes must go through secure API endpoints
-- ============================================

