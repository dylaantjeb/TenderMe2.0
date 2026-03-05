import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = [
  '/tenders',
  '/settings',
  '/team',
  '/api/tenders',
  '/api/upload',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only check auth for protected paths
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // If NEXTAUTH_SECRET is not configured, skip auth check
  if (!process.env.NEXTAUTH_SECRET) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'NEXTAUTH_SECRET is niet geconfigureerd' },
        { status: 503 }
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/tenders/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/api/tenders/:path*',
    '/api/upload/:path*',
  ],
};
