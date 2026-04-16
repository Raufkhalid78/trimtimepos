import { createClient } from '@supabase/supabase-js';

// Use Vite's import.meta.env for client-side access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const IS_PLACEHOLDER = !SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co' || !SUPABASE_ANON_KEY;

if (IS_PLACEHOLDER) {
    const errorMsg = "⚠️ Supabase configuration is missing or using placeholders. " + 
                  "Check your Vercel Environment Variables. " + 
                  "Current URL: " + (SUPABASE_URL || 'NONE') + " (VITE_SUPABASE_URL)";
    console.error(errorMsg);
} else {
    // Log masked config for debugging on Vercel dashboard console
    console.log("✅ Supabase initialized for: " + SUPABASE_URL.substring(0, 12) + "...");
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'dummy_key_to_prevent_crash_but_api_will_fail', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-application-name': 'trimtime-pos' },
    },
  }
);
