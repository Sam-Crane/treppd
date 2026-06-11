// apps/web/app/api/click/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Setup ───────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── POST: Record a click ─────────────────
export async function POST() {
  try {
    // Write to database
    const { error: insertError } = await supabase
      .from('clicks')
      .insert([{
        clicked_at: new Date().toISOString(),
        value: 1
      }]);

    if (insertError) throw insertError;

    // Get total count
    const { count, error: countError } = await supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    return NextResponse.json({
      message: 'Click saved!',
      total_clicks: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to save click' },
      { status: 500 }
    );
  }
}

// ─── GET: Get total clicks ────────────────
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      total_clicks: count || 0
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to get count' },
      { status: 500 }
    );
  }
}
