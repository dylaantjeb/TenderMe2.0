import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten'),
  email: z.string().email('Ongeldig emailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
  organizationName: z.string().min(2, 'Organisatienaam is verplicht'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Dit emailadres is al in gebruik' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: validated.organizationName,
          slug: slugify(validated.organizationName) + '-' + Date.now().toString(36),
          tier: 'FREE',
        },
      });

      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: 'OWNER',
          tier: 'FREE',
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    return NextResponse.json({
      success: true,
      message: 'Account aangemaakt',
      userId: result.user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het registreren' },
      { status: 500 }
    );
  }
}
