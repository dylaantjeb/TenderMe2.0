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

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization associated with this user' }, { status: 404 });
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, tier: true, settings: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const settings = (organization.settings as Record<string, unknown>) ?? {};

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      tier: organization.tier,
      sector: settings.sector ?? null,
    });
  } catch (error) {
    console.error('[GET /api/settings/organization]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization associated with this user' }, { status: 404 });
    }

    const body = await request.json();
    const { name, sector } = body;

    if (!name && sector === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or sector) is required' },
        { status: 400 }
      );
    }

    // Fetch current organization to merge settings
    const current = await db.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    if (!current) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const currentSettings = (current.settings as Record<string, unknown>) ?? {};
    const data: { name?: string; settings?: any } = {};

    if (name !== undefined) data.name = name;
    if (sector !== undefined) {
      data.settings = { ...currentSettings, sector };
    }

    const organization = await db.organization.update({
      where: { id: organizationId },
      data,
      select: { id: true, name: true, slug: true, tier: true, settings: true },
    });

    const updatedSettings = (organization.settings as Record<string, unknown>) ?? {};

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      tier: organization.tier,
      sector: updatedSettings.sector ?? null,
    });
  } catch (error) {
    console.error('[PATCH /api/settings/organization]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
