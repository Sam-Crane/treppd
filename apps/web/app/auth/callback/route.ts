import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Supabase redirects users here after they click the email confirmation
 * link (signup) or the password recovery link. We exchange the `code`
 * for a session and forward them to either `?next=...` or /onboarding.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';
  const errorDescription = searchParams.get('error_description');

  // Supabase can redirect back here with an error (expired link, already used)
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Missing confirmation code')}`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Verification successful — the session cookie is set by the client.
  // Safe-list allowed redirect targets to avoid open-redirect attacks.
  const safePaths = ['/onboarding', '/dashboard', '/reset-password'];
  const destination = safePaths.includes(next) ? next : '/onboarding';

  return NextResponse.redirect(`${origin}${destination}`);
}
