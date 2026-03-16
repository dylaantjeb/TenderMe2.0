import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const evidenceCategoryEnum = z.enum([
  'COMPANY_PROFILE',
  'CERTIFICATION',
  'REFERENCE_CASE',
  'KPI_ACHIEVEMENT',
  'METHODOLOGY',
  'STAFFING',
  'SECURITY_COMPLIANCE',
  'GOVERNANCE',
  'SUSTAINABILITY',
  'OTHER',
]);

const createEvidenceSchema = z.object({
  title: z.string().min(2, 'Titel moet minimaal 2 tekens bevatten'),
  content: z.string().min(10, 'Inhoud moet minimaal 10 tekens bevatten'),
  category: evidenceCategoryEnum,
  tags: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateEvidenceSchema = z.object({
  id: z.string(),
  title: z.string().min(2, 'Titel moet minimaal 2 tekens bevatten').optional(),
  content: z.string().min(10, 'Inhoud moet minimaal 10 tekens bevatten').optional(),
  category: evidenceCategoryEnum.optional(),
  tags: z.string().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (category) {
      where.category = category;
    }

    if (active !== null && active !== undefined && active !== '') {
      where.isActive = active === 'true';
    }

    if (search) {
      where.AND = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const items = await db.evidenceItem.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Knowledge list error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen kennisbank items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createEvidenceSchema.parse(body);

    const item = await db.evidenceItem.create({
      data: {
        title: validated.title,
        content: validated.content,
        category: validated.category,
        tags: validated.tags,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : null,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        metadata: validated.metadata ?? undefined,
        createdBy: session.user.id,
        organizationId: session.user.organizationId!,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create evidence error:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken kennisbank item' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateEvidenceSchema.parse(body);

    const existing = await db.evidenceItem.findUnique({
      where: { id: validated.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
    }

    if (existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Geen toegang tot dit item' }, { status: 403 });
    }

    const { id, validFrom, validUntil, ...updateFields } = validated;

    const item = await db.evidenceItem.update({
      where: { id },
      data: {
        ...updateFields,
        ...(validFrom !== undefined && {
          validFrom: validFrom ? new Date(validFrom) : null,
        }),
        ...(validUntil !== undefined && {
          validUntil: validUntil ? new Date(validUntil) : null,
        }),
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Update evidence error:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken kennisbank item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is vereist' }, { status: 400 });
    }

    const existing = await db.evidenceItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
    }

    if (existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Geen toegang tot dit item' }, { status: 403 });
    }

    await db.evidenceItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete evidence error:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen kennisbank item' }, { status: 500 });
  }
}
