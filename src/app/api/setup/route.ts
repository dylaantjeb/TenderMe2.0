import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const DEMO_EMAIL = 'demo@tenderme.nl';
const DEMO_PASSWORD = 'Demo1234!';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is niet geconfigureerd.' },
        { status: 503 }
      );
    }

    // Check if demo account already exists
    let existing;
    try {
      existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Table doesn't exist — tell user to run migrations
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('P2021')) {
        return NextResponse.json(
          {
            error: 'Database tabellen bestaan nog niet. Voer eerst `npx prisma db push` uit, of configureer de database via het Vercel dashboard.',
            hint: 'Run: npx prisma db push --accept-data-loss',
          },
          { status: 503 }
        );
      }
      throw e;
    }

    if (existing) {
      return NextResponse.json({
        message: 'Demo account bestaat al.',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: 'TenderMe Demo',
          slug: 'tenderme-demo-' + Date.now().toString(36),
          tier: 'PRO',
        },
      });

      const user = await tx.user.create({
        data: {
          name: 'Demo Gebruiker',
          email: DEMO_EMAIL,
          passwordHash,
          role: 'OWNER',
          tier: 'PRO',
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    return NextResponse.json({
      success: true,
      message: 'Demo account aangemaakt!',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      userId: result.user.id,
      organization: result.organization.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Setup error:', message);
    return NextResponse.json(
      { error: 'Setup mislukt: ' + message },
      { status: 500 }
    );
  }
}
