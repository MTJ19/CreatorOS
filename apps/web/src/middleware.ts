import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/api/auth'];
// Routes that redirect away from login if already authenticated
const AUTH_ROUTES = ['/login', '/register'];

// Explicit type to avoid TS2742 portability error with next-auth beta
type AuthMiddleware = (req: NextRequest) => Promise<NextResponse | Response>;

const middleware: AuthMiddleware = auth((req) => {
  const { nextUrl } = req;
  // next-auth attaches auth to the request in its augmented type — cast to access it
  const session = (req as typeof req & { auth?: { user?: unknown } }).auth;
  const isLoggedIn = !!session?.user;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname.startsWith(r));

  // Already logged in → redirect away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Not logged in → redirect to login
  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}) as unknown as AuthMiddleware;

export default middleware;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
