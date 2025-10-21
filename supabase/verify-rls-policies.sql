-- Verify and fix RLS policies for rankings table
-- This script checks for duplicate policies and ensures proper access

-- First, let's see all policies on the rankings table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'rankings';

-- Drop any duplicate policies (keeping only the one from the schema)
DROP POLICY IF EXISTS "Allow public read access to rankings" ON rankings;

-- Ensure the correct policy exists
DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
CREATE POLICY "Anyone can view rankings" ON rankings FOR SELECT USING (true);

-- Verify RLS is enabled on rankings
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'rankings';

-- If rowsecurity is false, enable it
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Test query (should work without errors)
SELECT COUNT(*) FROM rankings;

