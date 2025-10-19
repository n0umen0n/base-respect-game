-- ============================================
-- Backfill Game 3 Results
-- ============================================
-- Manually insert the Game 3 results that failed due to BIGINT overflow
-- Based on the blockchain events from transaction 0x9c5236ca5b907c7d6b76f9ffa3f8c8ce2a662efa11244656e5c0f0ff7c028d36
-- ============================================

-- Game 3 Results (from RespectDistributed events):
-- 1st place: 0x9612319530e550b00a54bdb57d143a6d378e178c - 210,000 tokens
-- 2nd place: 0x9d42c0d248a7770f635216260a20f20f9bf911d0 - 130,000 tokens  
-- 3rd place: 0x29ad662a04bea1961805179be16c93da78e81cb6 - 80,000 tokens

-- Insert game results
INSERT INTO game_results (member_address, game_number, rank, respect_earned)
VALUES 
  ('0x9612319530e550b00a54bdb57d143a6d378e178c', 3, 1, '210000000000000000000000'),
  ('0x9d42c0d248a7770f635216260a20f20f9bf911d0', 3, 2, '130000000000000000000000'),
  ('0x29ad662a04bea1961805179be16c93da78e81cb6', 3, 3, '80000000000000000000000')
ON CONFLICT (member_address, game_number) DO UPDATE
SET 
  rank = EXCLUDED.rank,
  respect_earned = EXCLUDED.respect_earned;

-- Insert respect history
INSERT INTO respect_history (member_address, game_number, respect_amount)
VALUES 
  ('0x9612319530e550b00a54bdb57d143a6d378e178c', 3, '210000000000000000000000'),
  ('0x9d42c0d248a7770f635216260a20f20f9bf911d0', 3, '130000000000000000000000'),
  ('0x29ad662a04bea1961805179be16c93da78e81cb6', 3, '80000000000000000000000')
ON CONFLICT (member_address, game_number) DO UPDATE
SET respect_amount = EXCLUDED.respect_amount;

-- Update member stats (calculated new averages based on blockchain)
-- 1st place member: 0x9612319530e550b00a54bdb57d143a6d378e178c
-- New average from event: 35000000000000000017500 (from logs: "0000000000000000000000000000000000000000000000007695a92c20d6fe0445c")
UPDATE members 
SET 
  total_respect_earned = COALESCE(total_respect_earned, 0) + 210000000000000000000000,
  average_respect = '35000000000000000017500'
WHERE wallet_address = '0x9612319530e550b00a54bdb57d143a6d378e178c';

-- 2nd place member: 0x9d42c0d248a7770f635216260a20f20f9bf911d0
-- New average from event: 21666666666666666673333 (from logs: "0000000000000000000000000000000000000000000000004968d670a69d78ac4b5")
UPDATE members 
SET 
  total_respect_earned = COALESCE(total_respect_earned, 0) + 130000000000000000000000,
  average_respect = '21666666666666666673333'
WHERE wallet_address = '0x9d42c0d248a7770f635216260a20f20f9bf911d0';

-- 3rd place member: 0x29ad662a04bea1961805179be16c93da78e81cb6
-- New average from event: 13333333333333333333333 (from logs: "0000000000000000000000000000000000000000000000002d2cd2bb7a398555555")
UPDATE members 
SET 
  total_respect_earned = COALESCE(total_respect_earned, 0) + 80000000000000000000000,
  average_respect = '13333333333333333333333'
WHERE wallet_address = '0x29ad662a04bea1961805179be16c93da78e81cb6';

-- Verify the updates
SELECT 
  m.wallet_address,
  m.name,
  m.total_respect_earned,
  m.average_respect,
  gr.game_number,
  gr.rank,
  gr.respect_earned
FROM members m
LEFT JOIN game_results gr ON m.wallet_address = gr.member_address AND gr.game_number = 3
WHERE m.wallet_address IN (
  '0x9612319530e550b00a54bdb57d143a6d378e178c',
  '0x9d42c0d248a7770f635216260a20f20f9bf911d0',
  '0x29ad662a04bea1961805179be16c93da78e81cb6'
)
ORDER BY gr.rank;

