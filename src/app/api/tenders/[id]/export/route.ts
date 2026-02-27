import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateWordDocument, generatePDFDocument } from '@/lib/export/generator';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const format = body.format || 'docx'; // 'docx' | 'pdf'

    const tender = await db.tender.findUnique({
      where: { id: params.id },
      include: {
        criteria: {
          where: { parentId: null },
          include: { children: true },
          orderBy: { sortOrder: 'asc' },
        },
        responses: {
          include: {
            criterionResponses: {
              include: { criterion: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        context: true,
      },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Tender niet gevonden' }, { status: 404 });
    }

    const latestResponse = tender.responses[0];
    if (!latestResponse) {
      return NextResponse.json(
        { error: 'Geen antwoorden beschikbaar om te exporteren' },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    if (format === 'pdf') {
      buffer = await generatePDFDocument(tender, latestResponse);
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      buffer = await generateWordDocument(tender, latestResponse);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    }

    const fileName = `${tender.title.replace(/[^a-zA-Z0-9\s-]/g, '')}_EMVI_Response.${extension}`;

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: params.id,
        action: 'TENDER_EXPORTED',
        resource: 'Tender',
        resourceId: params.id,
        details: { format, fileName },
      },
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Fout bij exporteren' },
      { status: 500 }
    );
  }
}
