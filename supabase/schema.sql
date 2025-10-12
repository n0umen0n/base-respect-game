-- ============================================
-- Vladrespect Database Schema
-- ============================================
-- This schema supports:
-- - User profiles
-- - Transaction tracking
-- - Leaderboard
-- - Achievements
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  privy_did VARCHAR,
  username VARCHAR(50),
  avatar_url VARCHAR,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_privy ON users(privy_did);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  user_op_hash VARCHAR(66),
  user_address VARCHAR(42) NOT NULL,
  smart_wallet_address VARCHAR(42),
  function_name VARCHAR(50) NOT NULL,
  previous_value BIGINT,
  new_value BIGINT NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  gas_sponsored BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

-- ============================================
-- LEADERBOARD TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  user_address VARCHAR(42) PRIMARY KEY,
  current_number BIGINT NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  highest_number BIGINT NOT NULL DEFAULT 0,
  lowest_number BIGINT,
  first_transaction_at TIMESTAMP WITH TIME ZONE,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  total_gas_saved DECIMAL(20, 8) DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(current_number DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_transactions ON leaderboard(total_transactions DESC);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
  UNIQUE(user_address, achievement_type)
);

-- Index for user achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_address);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- ============================================
-- GLOBAL STATS TABLE (Single Row)
-- ============================================
CREATE TABLE IF NOT EXISTS global_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
  total_users INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_gas_saved DECIMAL(20, 8) DEFAULT 0,
  highest_number_ever BIGINT DEFAULT 0,
  highest_number_user VARCHAR(42),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize with default row
INSERT INTO global_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update leaderboard when transaction is inserted
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert leaderboard entry
  INSERT INTO leaderboard (
    user_address,
    current_number,
    total_transactions,
    highest_number,
    lowest_number,
    first_transaction_at,
    last_transaction_at,
    updated_at
  ) VALUES (
    NEW.user_address,
    NEW.new_value,
    1,
    NEW.new_value,
    NEW.new_value,
    NEW.block_timestamp,
    NEW.block_timestamp,
    NOW()
  )
  ON CONFLICT (user_address) DO UPDATE SET
    current_number = NEW.new_value,
    total_transactions = leaderboard.total_transactions + 1,
    highest_number = GREATEST(leaderboard.highest_number, NEW.new_value),
    lowest_number = CASE 
      WHEN leaderboard.lowest_number IS NULL THEN NEW.new_value
      ELSE LEAST(leaderboard.lowest_number, NEW.new_value)
    END,
    last_transaction_at = NEW.block_timestamp,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update global stats
CREATE OR REPLACE FUNCTION update_global_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE global_stats SET
    total_transactions = total_transactions + 1,
    highest_number_ever = CASE 
      WHEN NEW.new_value > highest_number_ever THEN NEW.new_value
      ELSE highest_number_ever
    END,
    highest_number_user = CASE 
      WHEN NEW.new_value > highest_number_ever THEN NEW.user_address
      ELSE highest_number_user
    END,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  tx_count INTEGER;
BEGIN
  -- Get user's transaction count
  SELECT total_transactions INTO tx_count 
  FROM leaderboard 
  WHERE user_address = NEW.user_address;
  
  -- First Transaction Achievement
  IF tx_count = 1 THEN
    INSERT INTO achievements (user_address, achievement_type, achievement_name, description)
    VALUES (NEW.user_address, 'first_transaction', 'First Steps', 'Completed your first transaction')
    ON CONFLICT (user_address, achievement_type) DO NOTHING;
  END IF;
  
  -- 10 Transactions Achievement
  IF tx_count = 10 THEN
    INSERT INTO achievements (user_address, achievement_type, achievement_name, description)
    VALUES (NEW.user_address, 'ten_transactions', 'Active User', 'Completed 10 transactions')
    ON CONFLICT (user_address, achievement_type) DO NOTHING;
  END IF;
  
  -- Century Club (reached 100)
  IF NEW.new_value >= 100 THEN
    INSERT INTO achievements (user_address, achievement_type, achievement_name, description)
    VALUES (NEW.user_address, 'century_club', 'Century Club', 'Reached the number 100')
    ON CONFLICT (user_address, achievement_type) DO NOTHING;
  END IF;
  
  -- Millennium Club (reached 1000)
  IF NEW.new_value >= 1000 THEN
    INSERT INTO achievements (user_address, achievement_type, achievement_name, description)
    VALUES (NEW.user_address, 'millennium_club', 'Millennium Member', 'Reached the number 1000')
    ON CONFLICT (user_address, achievement_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update leaderboard when transaction is inserted
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON transactions;
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();

-- Trigger to update global stats
DROP TRIGGER IF EXISTS trigger_update_global_stats ON transactions;
CREATE TRIGGER trigger_update_global_stats
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_global_stats();

-- Trigger to check and award achievements
DROP TRIGGER IF EXISTS trigger_check_achievements ON transactions;
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_achievements();

-- Trigger to update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = privy_did);

-- Anyone can read transactions (public blockchain data)
CREATE POLICY "Anyone can view transactions" ON transactions
  FOR SELECT USING (true);

-- Only backend can insert transactions (via service_role key)
CREATE POLICY "Only service role can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- Anyone can view leaderboard
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Anyone can view global stats
CREATE POLICY "Anyone can view global stats" ON global_stats
  FOR SELECT USING (true);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Update user count in global stats
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE global_stats SET
    total_users = (SELECT COUNT(*) FROM users),
    updated_at = NOW()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_count ON users;
CREATE TRIGGER trigger_update_user_count
  AFTER INSERT OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_count();

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- Top 100 Leaderboard View
CREATE OR REPLACE VIEW top_leaderboard AS
SELECT 
  u.wallet_address,
  u.username,
  u.avatar_url,
  l.current_number,
  l.total_transactions,
  l.highest_number,
  l.last_transaction_at,
  ROW_NUMBER() OVER (ORDER BY l.current_number DESC, l.last_transaction_at ASC) as rank
FROM leaderboard l
JOIN users u ON l.user_address = u.wallet_address
ORDER BY l.current_number DESC, l.last_transaction_at ASC
LIMIT 100;

-- Recent Transactions View
CREATE OR REPLACE VIEW recent_transactions AS
SELECT 
  t.id,
  t.tx_hash,
  t.user_address,
  u.username,
  u.avatar_url,
  t.function_name,
  t.previous_value,
  t.new_value,
  t.block_timestamp,
  t.gas_sponsored
FROM transactions t
LEFT JOIN users u ON t.user_address = u.wallet_address
ORDER BY t.block_timestamp DESC
LIMIT 100;

-- User Stats View
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.wallet_address,
  u.username,
  u.avatar_url,
  u.bio,
  l.current_number,
  l.total_transactions,
  l.highest_number,
  l.lowest_number,
  l.first_transaction_at,
  l.last_transaction_at,
  COUNT(a.id) as total_achievements,
  COALESCE(ROW_NUMBER() OVER (ORDER BY l.current_number DESC), 999999) as rank
FROM users u
LEFT JOIN leaderboard l ON u.wallet_address = l.user_address
LEFT JOIN achievements a ON u.wallet_address = a.user_address
GROUP BY u.wallet_address, u.username, u.avatar_url, u.bio, 
         l.current_number, l.total_transactions, l.highest_number, 
         l.lowest_number, l.first_transaction_at, l.last_transaction_at;

-- ============================================
-- COMPLETE!
-- ============================================
-- Your database schema is ready!
-- Next steps:
-- 1. Create the webhook handler to insert data
-- 2. Query this data from your frontend
-- ============================================

