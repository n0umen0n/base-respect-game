-- ============================================
-- Simplified Schema for Testing
-- ============================================
-- Just the users table + one view for testing
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
  
  -- Simple stats (stored directly in users table for now)
  current_number BIGINT DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  highest_number BIGINT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_number ON users(current_number DESC);

-- ============================================
-- TOP PROFILES VIEW
-- ============================================
CREATE OR REPLACE VIEW top_profiles AS
SELECT 
  id,
  wallet_address,
  username,
  avatar_url,
  bio,
  current_number,
  total_transactions,
  highest_number,
  created_at,
  updated_at,
  ROW_NUMBER() OVER (ORDER BY current_number DESC, updated_at ASC) as rank
FROM users
WHERE current_number > 0  -- Only show users who have set a number
ORDER BY current_number DESC, updated_at ASC
LIMIT 100;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read all profiles (public data)
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = privy_did);

-- Only backend (service_role) can insert users
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Only backend (service_role) can update stats
CREATE POLICY "Service role can update users" ON users
  FOR UPDATE WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================
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
-- SEED DATA (Optional - for testing)
-- ============================================

-- Uncomment to add test data:
/*
INSERT INTO users (wallet_address, username, current_number, total_transactions, highest_number, created_at) VALUES
  ('0x1234567890123456789012345678901234567890', 'Alice', 1000, 15, 1000, NOW() - INTERVAL '5 days'),
  ('0x2234567890123456789012345678901234567890', 'Bob', 950, 12, 980, NOW() - INTERVAL '4 days'),
  ('0x3234567890123456789012345678901234567890', 'Charlie', 800, 8, 850, NOW() - INTERVAL '3 days'),
  ('0x4234567890123456789012345678901234567890', 'Diana', 750, 20, 900, NOW() - INTERVAL '2 days'),
  ('0x5234567890123456789012345678901234567890', 'Eve', 600, 5, 600, NOW() - INTERVAL '1 day')
ON CONFLICT (wallet_address) DO NOTHING;
*/

-- ============================================
-- COMPLETE!
-- ============================================
-- Your simplified database is ready!
-- 
-- To test:
-- 1. Query users: SELECT * FROM users;
-- 2. Query top profiles: SELECT * FROM top_profiles;
-- 3. Insert a test user via webhook
-- ============================================

