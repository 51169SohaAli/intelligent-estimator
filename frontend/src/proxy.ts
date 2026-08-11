import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // We check if they are on the register page
  const isAuthPage = pathname.startsWith('/register');
  const isDashboardRoute = pathname === '/' || pathname.startsWith('/dashboard');

  // Case A: User is NOT logged in, but is trying to access the dashboard
  if (isDashboardRoute && !token) {
    // 🚀 FIX: Redirect to /register instead of /login
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // Case B: User IS logged in, but tries to access /register
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};