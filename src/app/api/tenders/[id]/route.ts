import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const tender = await db.tender.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
        criteria: {
          where: { parentId: null },
          include: {
            children: true,
            responses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        context: true,
        responses: {
          include: {
            criterionResponses: {
              include: { criterion: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Tender niet gevonden' }, { status: 404 });
    }

    // Check access
    if (tender.userId !== session.user.id && tender.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: tender });
  } catch (error) {
    console.error('Get tender error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen tender' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const tender = await db.tender.update({
      where: { id: params.id },
      data: body,
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: params.id,
        action: 'TENDER_UPDATED',
        resource: 'Tender',
        resourceId: params.id,
        details: { fields: Object.keys(body) },
      },
    });

    return NextResponse.json({ success: true, data: tender });
  } catch (error) {
    console.error('Update tender error:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken tender' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const tender = await db.tender.findUnique({ where: { id: params.id } });
    if (!tender || tender.userId !== session.user.id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await db.tender.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Tender verwijderd' });
  } catch (error) {
    console.error('Delete tender error:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen tender' }, { status: 500 });
  }
}
