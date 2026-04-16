import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Fail loudly with a message that points at the real fix, rather than
    // the cryptic "Your project's URL and API key are required" that
    // @supabase/ssr throws. NEXT_PUBLIC_* vars are inlined at `next build`
    // time — if they're missing here, the Docker build didn't receive them
    // as build args (see apps/web/Dockerfile + docker-compose.yml).
    throw new Error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'are missing in the compiled bundle. Pass them as Docker build ' +
        'args (see docker-compose.yml `web.build.args`) or set them in your ' +
        'deployment platform\'s build-time env.',
    );
  }

  return createBrowserClient(url, anonKey);
}
