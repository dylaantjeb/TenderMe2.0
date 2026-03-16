import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, tier: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[GET /api/settings/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name && !email) {
      return NextResponse.json(
        { error: 'At least one field (name or email) is required' },
        { status: 400 }
      );
    }

    const data: { name?: string; email?: string } = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) {
      // Check for email uniqueness
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
      data.email = email;
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, tier: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[PATCH /api/settings/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
