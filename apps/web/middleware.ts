import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedPaths = [
    '/dashboard',
    '/roadmap',
    '/forms',
    '/chat',
    '/documents',
    '/appointments',
    '/settings',
    '/onboarding',
  ];

  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages and marketing landing
  // (but NOT from /verify-email, /reset-password, /auth/callback — those
  // have their own logic for handling intermediate session states).
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isLandingPage = request.nextUrl.pathname === '/';

  if ((isAuthPage || isLandingPage) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/roadmap/:path*',
    '/forms/:path*',
    '/chat/:path*',
    '/documents/:path*',
    '/appointments/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/',
  ],
};
