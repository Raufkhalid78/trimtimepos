const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parse of .env.local
const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    acc[key.trim()] = val.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function checkTenants() {
  try {
    const { data, error } = await supabase.from('tenants').select('id, business_name, slug').limit(5);
    if (error) {
      console.error('Error fetching tenants:', error);
    } else {
      console.log('Tenants:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Promise catch:', e);
  }
}

checkTenants();
