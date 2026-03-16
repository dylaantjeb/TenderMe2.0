import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MANAGE_ROLES = ['OWNER', 'ADMIN'];

async function getAuthenticatedManager() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) };
  }

  if (!session.user.organizationId) {
    return { error: NextResponse.json({ error: 'Geen organisatie gekoppeld' }, { status: 403 }) };
  }

  if (!MANAGE_ROLES.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Alleen eigenaren en beheerders kunnen het team beheren' },
        { status: 403 }
      ),
    };
  }

  return { session };
}

// GET — List all team members in the user's organization
export async function GET() {
  const { session, error } = await getAuthenticatedManager();
  if (error) return error;

  const members = await db.user.findMany({
    where: { organizationId: session!.user.organizationId! },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ members });
}

// POST — Invite a new team member
export async function POST(request: NextRequest) {
  const { session, error } = await getAuthenticatedManager();
  if (error) return error;

  const body = await request.json();
  const { email, role, name } = body as { email: string; role: string; name?: string };

  if (!email || !role) {
    return NextResponse.json(
      { error: 'Email en rol zijn verplicht' },
      { status: 400 }
    );
  }

  const validRoles = ['ADMIN', 'EDITOR', 'VIEWER'];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: `Ongeldige rol. Kies uit: ${validRoles.join(', ')}` },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: 'Er bestaat al een gebruiker met dit e-mailadres' },
      { status: 409 }
    );
  }

  // Check maxUsers limit
  const organization = await db.organization.findUnique({
    where: { id: session!.user.organizationId! },
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organisatie niet gevonden' },
      { status: 404 }
    );
  }

  const currentMemberCount = await db.user.count({
    where: { organizationId: session!.user.organizationId! },
  });

  if (organization.maxUsers && currentMemberCount >= organization.maxUsers) {
    return NextResponse.json(
      {
        error: `Maximaal aantal gebruikers bereikt (${organization.maxUsers}). Upgrade uw abonnement om meer teamleden toe te voegen.`,
      },
      { status: 403 }
    );
  }

  // Generate a random temporary password
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const newUser = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      role: role as any,
      organizationId: session!.user.organizationId!,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      user: newUser,
      tempPassword,
      message: 'Teamlid succesvol uitgenodigd',
    },
    { status: 201 }
  );
}

// DELETE — Remove a team member
export async function DELETE(request: NextRequest) {
  const { session, error } = await getAuthenticatedManager();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is verplicht' },
      { status: 400 }
    );
  }

  // Cannot remove yourself
  if (userId === session!.user.id) {
    return NextResponse.json(
      { error: 'U kunt uzelf niet verwijderen uit het team' },
      { status: 400 }
    );
  }

  // Find the target user
  const targetUser = await db.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Gebruiker niet gevonden' },
      { status: 404 }
    );
  }

  // Must be in the same organization
  if (targetUser.organizationId !== session!.user.organizationId) {
    return NextResponse.json(
      { error: 'Gebruiker behoort niet tot uw organisatie' },
      { status: 403 }
    );
  }

  // Cannot remove the OWNER
  if (targetUser.role === 'OWNER') {
    return NextResponse.json(
      { error: 'De eigenaar van de organisatie kan niet worden verwijderd' },
      { status: 403 }
    );
  }

  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: 'Teamlid succesvol verwijderd' });
}
