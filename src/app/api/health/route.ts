import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    },
  };

  const missing = Object.entries(checks.env)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    return NextResponse.json(
      { ...checks, status: 'degraded', missing },
      { status: 200 }
    );
  }

  return NextResponse.json(checks);
}
