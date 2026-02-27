import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createTenderSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().optional(),
  currency: z.string().default('EUR'),
  contractingAuth: z.string().optional(),
  sector: z.string().optional(),
  region: z.string().optional(),
  language: z.string().default('nl'),
  source: z.enum(['UPLOAD', 'TENDERNED', 'MERCELL', 'MANUAL']).default('MANUAL'),
  sourceUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {
      OR: [
        { userId: session.user.id },
        { organizationId: session.user.organizationId },
      ],
    };

    if (status) where.status = status;
    if (search) {
      where.AND = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { contractingAuth: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [tenders, total] = await Promise.all([
      db.tender.findMany({
        where,
        include: {
          documents: { select: { id: true, fileName: true, fileType: true } },
          criteria: { where: { parentId: null }, select: { id: true, name: true, weight: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.tender.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tenders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Tenders list error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen tenders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTenderSchema.parse(body);

    const tender = await db.tender.create({
      data: {
        ...validated,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        status: 'DRAFT',
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: tender.id,
        action: 'TENDER_CREATED',
        resource: 'Tender',
        resourceId: tender.id,
      },
    });

    return NextResponse.json({ success: true, data: tender }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create tender error:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken tender' }, { status: 500 });
  }
}
