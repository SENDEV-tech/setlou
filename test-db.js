const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pivqfvxsztyjuzqydbof.supabase.co'; // using typical fallback or let's read from env
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('shops').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Shops fields:', Object.keys(data[0] || {}));
  }
}
main();
