/**
 * Quick Supabase Connection Test Script
 * 
 * Run: node test-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure .env.local has:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✓ Environment variables found');
console.log('  URL:', supabaseUrl);
console.log('  Key:', supabaseKey.slice(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Can we connect?
    console.log('\n📡 Test 1: Testing connection...');
    const { error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      throw connectionError;
    }
    console.log('✅ Connection successful!');

    // Test 2: Can we query users table?
    console.log('\n📊 Test 2: Querying users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      throw usersError;
    }
    console.log(`✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   Sample user:', users[0]);
    }

    // Test 3: Can we query the view?
    console.log('\n👀 Test 3: Querying top_profiles view...');
    const { data: profiles, error: profilesError } = await supabase
      .from('top_profiles')
      .select('*')
      .limit(3);

    if (profilesError) {
      throw profilesError;
    }
    console.log(`✅ View working! Found ${profiles.length} profiles`);

    // Success summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('Your Supabase connection is working perfectly!');
    console.log('You can now proceed to deploy to Vercel.');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\nPossible issues:');
    console.error('  1. Wrong Supabase URL or key');
    console.error('  2. Schema not run yet (run schema-simple.sql)');
    console.error('  3. Table/view does not exist');
    console.error('  4. Network/firewall issue');
    console.error('='.repeat(50) + '\n');
    process.exit(1);
  }
}

testConnection();

