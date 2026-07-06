import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = 'sb_secret_A1guid5ooh-yiMVasQG8ug_eeKF-Whg';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('title, slug, created_at, category')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ posts: [] });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (e) {
    return NextResponse.json({ posts: [] });
  }
}
