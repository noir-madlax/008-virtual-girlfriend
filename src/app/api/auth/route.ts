import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bupqagkrcvrezjkdbald.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_NAf-GZnrrl6AOnb2w8p5Cg_r8So-Dar';

export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user, session: data.session });
    }

    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user, session: data.session });
    }

    return NextResponse.json({ error: '未知 action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
