-- ============================================
-- Populate Test Leaderboard Data
-- ============================================
-- This script inserts 50 test members with varying respect scores
-- Run this in your Supabase SQL Editor to test the leaderboard
-- ============================================

-- Insert 50 test members with realistic data
INSERT INTO members (
  wallet_address,
  name,
  profile_url,
  x_account,
  x_verified,
  is_approved,
  is_banned,
  joined_at,
  total_respect_earned,
  average_respect
) VALUES
  -- Top tier (90-100)
  ('0x1111111111111111111111111111111111111111', 'VLADISLAV', 'https://api.dicebear.com/7.x/avataaars/svg?seed=vlad', 'cxzvnk', true, true, false, NOW() - INTERVAL '45 days', 870, 87),
  ('0x2222222222222222222222222222222222222222', 'Sarah Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'sarahchen', true, true, false, NOW() - INTERVAL '40 days', 840, 84),
  ('0x3333333333333333333333333333333333333333', 'Marcus Williams', 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus', 'marcusdev', true, true, false, NOW() - INTERVAL '38 days', 820, 82),
  
  -- High performers (70-89)
  ('0x4444444444444444444444444444444444444444', 'Elena Rodriguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena', 'elenabuilds', true, true, false, NOW() - INTERVAL '35 days', 790, 79),
  ('0x5555555555555555555555555555555555555555', 'James Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 'jamesk', true, true, false, NOW() - INTERVAL '33 days', 760, 76),
  ('0x6666666666666666666666666666666666666666', 'Priya Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', 'priyacodes', false, true, false, NOW() - INTERVAL '30 days', 730, 73),
  ('0x7777777777777777777777777777777777777777', 'Alex Turner', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'alexturner', true, true, false, NOW() - INTERVAL '28 days', 700, 70),
  
  -- Mid-high tier (50-69)
  ('0x8888888888888888888888888888888888888888', 'Nina Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina', 'ninapatel', false, true, false, NOW() - INTERVAL '25 days', 680, 68),
  ('0x9999999999999999999999999999999999999999', 'David Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', NULL, false, true, false, NOW() - INTERVAL '24 days', 650, 65),
  ('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'Maria Santos', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', 'mariasantos', true, true, false, NOW() - INTERVAL '22 days', 620, 62),
  ('0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'Tom Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', 'tomanderson', false, true, false, NOW() - INTERVAL '20 days', 590, 59),
  ('0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'Yuki Tanaka', 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki', 'yukitanaka', true, true, false, NOW() - INTERVAL '19 days', 560, 56),
  ('0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'Oliver Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver', NULL, false, true, false, NOW() - INTERVAL '18 days', 530, 53),
  ('0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'Sofia Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia', 'sofiagarcia', false, true, false, NOW() - INTERVAL '17 days', 500, 50),
  
  -- Mid tier (40-49)
  ('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'John Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', NULL, false, true, false, NOW() - INTERVAL '16 days', 480, 48),
  ('0x1000000000000000000000000000000000000001', 'Emma Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 'emmawilson', true, true, false, NOW() - INTERVAL '15 days', 460, 46),
  ('0x1000000000000000000000000000000000000002', 'Lucas Silva', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas', 'lucassilva', false, true, false, NOW() - INTERVAL '14 days', 440, 44),
  ('0x1000000000000000000000000000000000000003', 'Aisha Mohammed', 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha', NULL, false, true, false, NOW() - INTERVAL '13 days', 420, 42),
  ('0x1000000000000000000000000000000000000004', 'Kevin Zhang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin', 'kevinzhang', true, true, false, NOW() - INTERVAL '12 days', 400, 40),
  
  -- Lower-mid tier (30-39)
  ('0x1000000000000000000000000000000000000005', 'Anton Angry', 'https://api.dicebear.com/7.x/avataaars/svg?seed=anton', NULL, false, true, false, NOW() - INTERVAL '11 days', 380, 38),
  ('0x1000000000000000000000000000000000000006', 'Isabella Lopez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella', 'isabellalopez', false, true, false, NOW() - INTERVAL '10 days', 360, 36),
  ('0x1000000000000000000000000000000000000007', 'Mohammed Ali', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mohammed', 'mohammedali', true, true, false, NOW() - INTERVAL '9 days', 340, 34),
  ('0x1000000000000000000000000000000000000008', 'Chloe Martin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chloe', NULL, false, true, false, NOW() - INTERVAL '8 days', 320, 32),
  ('0x1000000000000000000000000000000000000009', 'Ryan O''Connor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan', 'ryanoconnor', false, true, false, NOW() - INTERVAL '7 days', 300, 30),
  
  -- Entry level (20-29)
  ('0x100000000000000000000000000000000000000A', 'Lily Wang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lily', 'lilywang', true, true, false, NOW() - INTERVAL '6 days', 280, 28),
  ('0x100000000000000000000000000000000000000B', 'Carlos Mendez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', NULL, false, true, false, NOW() - INTERVAL '5 days', 260, 26),
  ('0x100000000000000000000000000000000000000C', 'Fatima Hassan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima', 'fatimahassan', false, true, false, NOW() - INTERVAL '4 days', 240, 24),
  ('0x100000000000000000000000000000000000000D', 'Jack Taylor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack', 'jacktaylor', true, true, false, NOW() - INTERVAL '3 days', 220, 22),
  ('0x100000000000000000000000000000000000000E', 'Maya Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya', NULL, false, true, false, NOW() - INTERVAL '2 days', 200, 20),
  
  -- Beginners (10-19)
  ('0x100000000000000000000000000000000000000F', 'Noah White', 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah', 'noahwhite', false, true, false, NOW() - INTERVAL '1 day', 180, 18),
  ('0x1000000000000000000000000000000000000010', 'Zara Ahmed', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zara', 'zaraahmed', true, true, false, NOW() - INTERVAL '23 hours', 160, 16),
  ('0x1000000000000000000000000000000000000011', 'Ethan Harris', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ethan', NULL, false, true, false, NOW() - INTERVAL '20 hours', 140, 14),
  ('0x1000000000000000000000000000000000000012', 'Amelia Clark', 'https://api.dicebear.com/7.x/avataaars/svg?seed=amelia', 'ameliaclark', false, true, false, NOW() - INTERVAL '18 hours', 120, 12),
  ('0x1000000000000000000000000000000000000013', 'Liam Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liam', 'liammartinez', true, true, false, NOW() - INTERVAL '16 hours', 100, 10),
  
  -- New members (5-9)
  ('0x1000000000000000000000000000000000000014', 'Hannah Lewis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hannah', NULL, false, true, false, NOW() - INTERVAL '14 hours', 90, 9),
  ('0x1000000000000000000000000000000000000015', 'Oscar Robinson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=oscar', 'oscarrobinson', false, true, false, NOW() - INTERVAL '12 hours', 80, 8),
  ('0x1000000000000000000000000000000000000016', 'Mia Walker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mia', 'miawalker', true, true, false, NOW() - INTERVAL '10 hours', 70, 7),
  ('0x1000000000000000000000000000000000000017', 'Benjamin Hall', 'https://api.dicebear.com/7.x/avataaars/svg?seed=benjamin', NULL, false, true, false, NOW() - INTERVAL '8 hours', 60, 6),
  ('0x1000000000000000000000000000000000000018', 'Ava Young', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ava', 'avayoung', false, true, false, NOW() - INTERVAL '6 hours', 50, 5),
  
  -- Very new (0-4)
  ('0x1000000000000000000000000000000000000019', 'William King', 'https://api.dicebear.com/7.x/avataaars/svg?seed=william', 'williamking', true, true, false, NOW() - INTERVAL '4 hours', 40, 4),
  ('0x100000000000000000000000000000000000001A', 'Charlotte Wright', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlotte', NULL, false, true, false, NOW() - INTERVAL '3 hours', 30, 3),
  ('0x100000000000000000000000000000000000001B', 'James Scott', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamesscott', 'jamesscott', false, true, false, NOW() - INTERVAL '2 hours', 20, 2),
  ('0x100000000000000000000000000000000000001C', 'Emily Green', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', 'emilygreen', true, true, false, NOW() - INTERVAL '1 hour', 10, 1),
  ('0x100000000000000000000000000000000000001D', 'Liz', 'https://i.pravatar.cc/150?img=5', NULL, false, true, false, NOW() - INTERVAL '30 minutes', 0, 0),
  
  -- Additional members for testing
  ('0x100000000000000000000000000000000000001E', 'ARNOLD SCHWARZENEGGER', 'https://i.pravatar.cc/150?img=33', NULL, false, true, false, NOW() - INTERVAL '25 minutes', 0, 0),
  ('0x100000000000000000000000000000000000001F', 'John Travolta', 'https://i.pravatar.cc/150?img=12', NULL, false, true, false, NOW() - INTERVAL '20 minutes', 0, 0),
  ('0x1000000000000000000000000000000000000020', 'Bruce Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruce', 'brucelee', true, true, false, NOW() - INTERVAL '15 minutes', 0, 0),
  ('0x1000000000000000000000000000000000000021', 'Jackie Chan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jackie', 'jackiechan', true, true, false, NOW() - INTERVAL '10 minutes', 0, 0),
  ('0x1000000000000000000000000000000000000022', 'Chuck Norris', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chuck', 'chucknorris', true, true, false, NOW() - INTERVAL '5 minutes', 0, 0)
ON CONFLICT (wallet_address) DO NOTHING;

-- Verify the data was inserted
SELECT 
  ROW_NUMBER() OVER (ORDER BY average_respect DESC, total_respect_earned DESC) as rank,
  name,
  x_account,
  x_verified,
  average_respect as respect_score,
  is_approved
FROM members
WHERE is_approved = true AND is_banned = false
ORDER BY average_respect DESC, total_respect_earned DESC
LIMIT 50;

-- ============================================
-- Summary Statistics
-- ============================================
SELECT 
  COUNT(*) as total_members,
  COUNT(CASE WHEN x_account IS NOT NULL THEN 1 END) as members_with_x,
  COUNT(CASE WHEN x_verified = true THEN 1 END) as verified_x_accounts,
  ROUND(AVG(average_respect), 2) as avg_respect_score,
  MAX(average_respect) as max_respect_score
FROM members
WHERE is_approved = true AND is_banned = false;

