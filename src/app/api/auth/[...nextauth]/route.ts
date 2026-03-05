import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Wrap NextAuth handler to prevent crashes when env vars are missing
function createHandler() {
  try {
    return NextAuth(authOptions);
  } catch {
    return (_req: NextRequest) =>
      NextResponse.json(
        { error: 'Auth is niet geconfigureerd. Stel NEXTAUTH_SECRET in.' },
        { status: 503 }
      );
  }
}

const handler = createHandler();

export { handler as GET, handler as POST };
