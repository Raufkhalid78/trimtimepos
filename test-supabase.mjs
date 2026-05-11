import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Invoking hyper-responder...");
  const { data, error } = await supabase.functions.invoke('hyper-responder', {
    body: { prompt: "Test prompt" }
  });

  if (error) {
    console.error("Error calling edge function:", error);
  } else {
    console.log("Success! Response:", data);
  }
}

test();
