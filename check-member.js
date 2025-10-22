// Quick check if member exists
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMember() {
  const address = '0xe4fe052a4b9a84ffcdcdbdd2ea564259798f48a4';
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('wallet_address', address)
    .single();
  
  if (error) {
    console.log('Member not found or error:', error.message);
  } else {
    console.log('Member exists:');
    console.log('- Name:', data.name);
    console.log('- Approved:', data.is_approved);
    console.log('- Banned:', data.is_banned);
  }
}

checkMember();

