import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bupqagkrcvrezjkdbald.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_NAf-GZnrrl6AOnb2w8p5Cg_r8So-Dar';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
