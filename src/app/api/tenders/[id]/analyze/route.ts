import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildContext, analyzeCriteria } from '@/lib/ai/pipeline';

export async function POST(
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
      include: { documents: true },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Tender niet gevonden' }, { status: 404 });
    }

    if (tender.documents.length === 0) {
      return NextResponse.json(
        { error: 'Upload eerst documenten voordat u kunt analyseren' },
        { status: 400 }
      );
    }

    // Combine document texts
    const fullText = tender.documents
      .map((d) => d.extractedText)
      .filter(Boolean)
      .join('\n\n');

    if (fullText.length < 100) {
      return NextResponse.json(
        { error: 'Onvoldoende tekst geëxtraheerd uit documenten' },
        { status: 400 }
      );
    }

    // Update status
    await db.tender.update({
      where: { id: params.id },
      data: { status: 'ANALYZING' },
    });

    // Run Layer 1: Context Builder
    const context = await buildContext(fullText, params.id, session.user.id);

    // Run Layer 2: Criteria Intelligence
    const { extracted, intelligence } = await analyzeCriteria(
      fullText,
      params.id,
      session.user.id
    );

    // Update tender status
    await db.tender.update({
      where: { id: params.id },
      data: { status: 'CRITERIA_EXTRACTED' },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: params.id,
        action: 'TENDER_ANALYZED',
        resource: 'Tender',
        resourceId: params.id,
        details: {
          criteriaCount: extracted.criteria.length,
          scoringModel: intelligence.scoringModel,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        context,
        criteria: extracted,
        intelligence,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Analyze tender error:', message, error);

    // Reset status on error
    await db.tender.update({
      where: { id: params.id },
      data: { status: 'DRAFT' },
    }).catch(() => {});

    // Surface API key errors clearly
    const isConfigError = message.includes('niet geconfigureerd') || message.includes('API_KEY');
    return NextResponse.json(
      { error: isConfigError ? message : `Analyse fout: ${message}` },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
