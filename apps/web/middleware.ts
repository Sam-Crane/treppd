import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decodeAdminRole } from '@/lib/auth/claims';

const CONSUMER_PATHS = [
  '/dashboard',
  '/roadmap',
  '/forms',
  '/chat',
  '/documents',
  '/appointments',
  '/settings',
  '/onboarding',
  '/housing',
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  const path = request.nextUrl.pathname;
  const isAdmin = decodeAdminRole(session?.access_token) !== null;

  const isAdminPath = path.startsWith('/admin');
  const isConsumerPath = CONSUMER_PATHS.some((p) => path.startsWith(p));

  // Unauthenticated users can't reach any protected area.
  if ((isAdminPath || isConsumerPath) && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Hard role separation:
  //  - non-admins cannot enter the admin portal
  //  - admins are kept out of the consumer app
  if (isAdminPath && session && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (isConsumerPath && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Logged-in users leaving auth pages / landing → their home surface.
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPaths.some((p) => path.startsWith(p));
  const isLandingPage = path === '/';
  if ((isAuthPage || isLandingPage) && session) {
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin' : '/dashboard', request.url),
    );
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
    '/admin/:path*',
    '/housing/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/',
  ],
};
