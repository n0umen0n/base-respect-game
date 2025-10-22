-- ============================================
-- SECURITY FIX for Respect Game Tables
-- ============================================
-- This fixes the security vulnerability where anyone could
-- update member profiles due to the permissive RLS policy
-- ============================================

-- ============================================
-- DROP INSECURE POLICIES
-- ============================================

-- This is the VULNERABLE policy that allowed anyone to edit profiles!
DROP POLICY IF EXISTS "Allow X account updates" ON members;

-- Drop all other potentially insecure policies
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
DROP POLICY IF EXISTS "Service role can insert member_approvals" ON member_approvals;
DROP POLICY IF EXISTS "Service role can insert respect_history" ON respect_history;

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

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

-- ============================================
-- CREATE SECURE READ-ONLY POLICIES FOR ANON KEY
-- ============================================
-- These policies are already in your schema, just keeping them

-- Public read access is already enabled via:
-- "Anyone can view members", "Anyone can view game_stages", etc.
-- These policies remain unchanged

-- ============================================
-- NO WRITE POLICIES FOR ANON KEY!
-- ============================================
-- By NOT creating INSERT/UPDATE/DELETE policies for anon users,
-- we ensure that ONLY the service_role key (backend) can write.
--
-- The old "Allow X account updates" policy has been removed above.
-- This was the vulnerability - it allowed anyone to update members!

-- ============================================
-- VERIFICATION
-- ============================================

-- To verify the fix worked, run these queries:

-- 1. Check that the vulnerable policy is gone:
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'members' AND policyname = 'Allow X account updates';
-- Expected: 0 rows (policy should not exist)

-- 2. Check that anon users can read:
SELECT COUNT(*) FROM members;
-- Expected: Should work

-- 3. Try to update as anon user (this should FAIL):
-- UPDATE members SET name = 'test' WHERE wallet_address = '0x...';
-- Expected: ERROR: new row violates row-level security policy for table "members"

-- ============================================
-- IMPORTANT NOTES
-- ============================================

-- ✅ Frontend (anon key) can now ONLY READ
-- ✅ Backend (service_role key) can READ and WRITE
-- ✅ Webhooks will continue to work (they use service_role key)
-- ✅ The new /api/update-profile endpoint uses service_role key
-- ✅ Your friend can NO LONGER edit your profile!

-- ============================================
-- COMPLETE!
-- ============================================

-- Your database is now secure!
-- All profile updates must go through the backend API
-- which verifies wallet signatures.

