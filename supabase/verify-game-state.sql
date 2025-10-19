-- ============================================
-- Verify and Update Game State
-- ============================================
-- Check current game state and update if needed
-- ============================================

-- Check current state
SELECT 
  'Current game state:' as info,
  current_game_number,
  current_stage,
  next_stage_timestamp,
  updated_at
FROM game_stages
WHERE id = 1;

-- Update to Game 4, ContributionSubmission stage if not already there
-- Based on StageChanged event from block 37043697
UPDATE game_stages
SET 
  current_game_number = 4,
  current_stage = 'ContributionSubmission',
  next_stage_timestamp = '2025-10-26T15:17:21.000Z',
  updated_at = NOW()
WHERE id = 1 AND (
  current_game_number != 4 
  OR current_stage != 'ContributionSubmission'
);

-- Verify the update
SELECT 
  'Updated game state:' as info,
  current_game_number,
  current_stage,
  next_stage_timestamp,
  updated_at
FROM game_stages
WHERE id = 1;

