-- Sync game_stages table with current blockchain state
-- Run this in Supabase SQL Editor

UPDATE game_stages
SET 
  current_game_number = 3,
  current_stage = 'ContributionSubmission',
  next_stage_timestamp = '2025-10-26T11:25:27.000Z',
  updated_at = NOW()
WHERE id = 1;

-- Verify the update
SELECT * FROM game_stages WHERE id = 1;

