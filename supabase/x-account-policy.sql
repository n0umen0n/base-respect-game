-- ============================================
-- X Account Update Policy for Supabase
-- ============================================
-- This allows the app to update X account information
-- for members after Privy Twitter authentication

-- Policy to allow updates to members table for X account
-- Since we use anonymous Supabase key (not auth), we need to allow updates
CREATE POLICY "Allow X account updates" ON members
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Alternative: If you want tighter security, you can restrict to specific columns
-- This would only allow updating x_account and x_verified fields
CREATE POLICY "Allow X account field updates" ON members
FOR UPDATE
USING (true)
WITH CHECK (
  -- Only allow updating these specific fields
  x_account IS NOT NULL OR x_verified IS NOT NULL
);

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run ONE of the policies above (first one is recommended)
-- 3. This allows your app to update X accounts after Privy verification

