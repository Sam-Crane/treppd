// apps/web/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// ─── These come from your .env file ──────
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Create the client ────────────────────
// This is what connects your app 
// to your database
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);