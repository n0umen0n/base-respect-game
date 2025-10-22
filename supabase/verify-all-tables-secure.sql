-- ============================================
-- VERIFY ALL TABLES ARE SECURE
-- ============================================
-- This script checks that ALL Respect Game tables
-- are properly secured with read-only access for anon key
-- ============================================

-- Check which policies exist for WRITE operations (INSERT/UPDATE/DELETE)
-- These should ONLY exist for service_role, but RLS doesn't work that way
-- So we need to DROP all write policies for anon users

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ READ (Safe)'
    WHEN cmd = 'INSERT' THEN '⚠️  INSERT (Check if secure)'
    WHEN cmd = 'UPDATE' THEN '⚠️  UPDATE (Check if secure)'
    WHEN cmd = 'DELETE' THEN '⚠️  DELETE (Check if secure)'
    ELSE '❓ UNKNOWN'
  END as safety_status,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'game_stages', 
    'contributions',
    'groups',
    'member_groups',
    'rankings',
    'game_results',
    'proposals',
    'proposal_votes',
    'member_approvals',
    'respect_history'
  )
ORDER BY 
  tablename,
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================
-- Expected SECURE state:
-- ============================================
-- Each table should have ONLY:
-- - 1 SELECT policy (for reading)
-- - NO INSERT/UPDATE/DELETE policies
--
-- If you see any INSERT/UPDATE/DELETE policies,
-- they are VULNERABLE because:
-- 1. Anon users can execute them
-- 2. They allow unrestricted writes with WITH CHECK (true)
-- ============================================

