-- ============================================
-- Delete Test Leaderboard Data
-- ============================================
-- This script removes all test members created by populate-test-leaderboard.sql
-- Run this in your Supabase SQL Editor to clean up test data
-- ============================================

-- Count test members before deletion
SELECT COUNT(*) as test_members_count
FROM members
WHERE wallet_address LIKE '0x1111%' 
   OR wallet_address LIKE '0x2222%'
   OR wallet_address LIKE '0x3333%'
   OR wallet_address LIKE '0x4444%'
   OR wallet_address LIKE '0x5555%'
   OR wallet_address LIKE '0x6666%'
   OR wallet_address LIKE '0x7777%'
   OR wallet_address LIKE '0x8888%'
   OR wallet_address LIKE '0x9999%'
   OR wallet_address LIKE '0xAAAA%'
   OR wallet_address LIKE '0xBBBB%'
   OR wallet_address LIKE '0xCCCC%'
   OR wallet_address LIKE '0xDDDD%'
   OR wallet_address LIKE '0xEEEE%'
   OR wallet_address LIKE '0xFFFF%'
   OR wallet_address LIKE '0x1000%';

-- Delete all test members
-- This will CASCADE delete all related data (contributions, rankings, game_results, etc.)
DELETE FROM members 
WHERE wallet_address LIKE '0x1111%' 
   OR wallet_address LIKE '0x2222%'
   OR wallet_address LIKE '0x3333%'
   OR wallet_address LIKE '0x4444%'
   OR wallet_address LIKE '0x5555%'
   OR wallet_address LIKE '0x6666%'
   OR wallet_address LIKE '0x7777%'
   OR wallet_address LIKE '0x8888%'
   OR wallet_address LIKE '0x9999%'
   OR wallet_address LIKE '0xAAAA%'
   OR wallet_address LIKE '0xBBBB%'
   OR wallet_address LIKE '0xCCCC%'
   OR wallet_address LIKE '0xDDDD%'
   OR wallet_address LIKE '0xEEEE%'
   OR wallet_address LIKE '0xFFFF%'
   OR wallet_address LIKE '0x1000%';

-- Verify deletion
SELECT COUNT(*) as remaining_members
FROM members;

-- Show remaining members (if any)
SELECT 
  ROW_NUMBER() OVER (ORDER BY average_respect DESC, total_respect_earned DESC) as rank,
  name,
  x_account,
  average_respect,
  is_approved
FROM members
WHERE is_approved = true AND is_banned = false
ORDER BY average_respect DESC, total_respect_earned DESC;

-- ============================================
-- Alternative: Delete ALL members (nuclear option)
-- ============================================
-- Uncomment the line below ONLY if you want to completely reset the members table
-- TRUNCATE members CASCADE;

