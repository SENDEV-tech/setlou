const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://acjkglrvcmobpcryedky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjamtnbHJ2Y21vYnBjcnllZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTA3MjYsImV4cCI6MjEwNTc2NjcyNn0.UsN_8ZgYd0KyaQVsu6GqR0MNOxTcQebLA9GLyJb3QtU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('shops').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Shops fields:', Object.keys(data[0] || {}));
  }
}
main();
