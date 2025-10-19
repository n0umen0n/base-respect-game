/**
 * Manual Game State Sync
 * Syncs Supabase database with current blockchain state
 */

import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Contract address and ABI
const RESPECT_GAME_CORE_ADDRESS = '0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29';

const RESPECT_GAME_CORE_ABI = [
  {
    name: 'currentGameNumber',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getCurrentStage',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'getNextStageTimestamp',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
];

async function main() {
  console.log('🔄 Starting game state sync...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Initialize blockchain client
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  // Read current blockchain state
  console.log('📡 Reading blockchain state...');
  const [gameNumber, stage, nextTimestamp] = await Promise.all([
    publicClient.readContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'currentGameNumber',
    }),
    publicClient.readContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'getCurrentStage',
    }),
    publicClient.readContract({
      address: RESPECT_GAME_CORE_ADDRESS,
      abi: RESPECT_GAME_CORE_ABI,
      functionName: 'getNextStageTimestamp',
    }),
  ]);

  const currentGameNumber = Number(gameNumber);
  const currentStage = Number(stage);
  const nextStageTimestamp = Number(nextTimestamp);

  const stageName = currentStage === 0 ? 'ContributionSubmission' : 'ContributionRanking';
  const nextStageDate = new Date(nextStageTimestamp * 1000).toISOString();

  console.log('✅ Blockchain state:');
  console.log(`   Game: ${currentGameNumber}`);
  console.log(`   Stage: ${stageName} (${currentStage})`);
  console.log(`   Next stage: ${new Date(nextStageTimestamp * 1000).toLocaleString()}`);
  console.log();

  // Read current database state
  console.log('💾 Reading database state...');
  const { data: dbState, error: readError } = await supabase
    .from('game_stages')
    .select('*')
    .eq('id', 1)
    .single();

  if (readError) {
    console.error('❌ Error reading database:', readError);
    throw readError;
  }

  console.log('Current database state:');
  console.log(`   Game: ${dbState.current_game_number}`);
  console.log(`   Stage: ${dbState.current_stage}`);
  console.log(`   Next stage: ${new Date(dbState.next_stage_timestamp).toLocaleString()}`);
  console.log();

  // Check if update is needed
  if (
    dbState.current_game_number === currentGameNumber &&
    dbState.current_stage === stageName &&
    dbState.next_stage_timestamp === nextStageDate
  ) {
    console.log('✅ Database is already in sync! No update needed.');
    return;
  }

  // Update database
  console.log('🔧 Updating database...');
  const { error: updateError } = await supabase
    .from('game_stages')
    .update({
      current_game_number: currentGameNumber,
      current_stage: stageName,
      next_stage_timestamp: nextStageDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (updateError) {
    console.error('❌ Error updating database:', updateError);
    throw updateError;
  }

  console.log('✅ Database updated successfully!');
  console.log();
  console.log('New database state:');
  console.log(`   Game: ${currentGameNumber}`);
  console.log(`   Stage: ${stageName}`);
  console.log(`   Next stage: ${new Date(nextStageTimestamp * 1000).toLocaleString()}`);
  console.log();
  console.log('🎉 Sync complete! Your UI should now show the correct game state.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

