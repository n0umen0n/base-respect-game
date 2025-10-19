-- ============================================
-- Fix BigInt Overflow for Token Amounts
-- ============================================
-- Changes BIGINT columns to NUMERIC to handle large token amounts
-- RESPECT tokens use 18 decimals, resulting in values like:
-- 210,000 tokens = 210,000,000,000,000,000,000,000 wei
-- This exceeds PostgreSQL BIGINT max (~9.2 × 10^18)
-- ============================================

-- Fix members table
ALTER TABLE members 
  ALTER COLUMN total_respect_earned TYPE NUMERIC USING total_respect_earned::numeric,
  ALTER COLUMN average_respect TYPE NUMERIC USING average_respect::numeric;

-- Fix game_results table
ALTER TABLE game_results 
  ALTER COLUMN respect_earned TYPE NUMERIC USING respect_earned::numeric;

-- Fix respect_history table
ALTER TABLE respect_history 
  ALTER COLUMN respect_amount TYPE NUMERIC USING respect_amount::numeric;

-- Verify changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('members', 'game_results', 'respect_history')
  AND column_name IN ('total_respect_earned', 'average_respect', 'respect_earned', 'respect_amount')
ORDER BY table_name, column_name;

