import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/ai/pipeline';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const maxIterations = Math.min(body.maxIterations || 2, 3);

    const tender = await db.tender.findUnique({
      where: { id: params.id },
      include: { criteria: { where: { parentId: null } } },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Tender niet gevonden' }, { status: 404 });
    }

    if (tender.criteria.length === 0) {
      return NextResponse.json(
        { error: 'Analyseer eerst de tender om criteria te extraheren' },
        { status: 400 }
      );
    }

    // Run full 5-layer pipeline
    const result = await runFullPipeline(params.id, session.user.id, maxIterations);

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        tenderId: params.id,
        action: 'RESPONSES_GENERATED',
        resource: 'TenderResponse',
        resourceId: result.responseId,
        details: {
          overallScore: result.overallScore,
          criteriaScored: result.criterionScores.length,
          maxIterations,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Generate responses error:', message, error);

    await db.tender.update({
      where: { id: params.id },
      data: { status: 'CRITERIA_EXTRACTED' },
    }).catch(() => {});

    const isConfigError = message.includes('niet geconfigureerd') || message.includes('API_KEY');
    return NextResponse.json(
      { error: isConfigError ? message : `Generatie fout: ${message}` },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
