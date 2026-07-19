const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fxzrmojooxsnofdnoxzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4enJtb2pvb3hzbm9mZG5veHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNDEyNzAsImV4cCI6MjA5OTgxNzI3MH0.gCaOjNVKR4gb3cf-8KMvaM1O801wd9pDtPNvFGMwz04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error, count } = await supabase
    .from('stickers')
    .select('number, slug, name, author, type', { count: 'exact' })
    .order('number', { ascending: true });
    
  if (error) {
    console.error('Error fetching stickers:', error);
    return;
  }
  
  console.log('Total stickers in database:', count);
  console.log('First 5 stickers:', data.slice(0, 5));
  console.log('Last 5 stickers:', data.slice(-5));
}

run();
