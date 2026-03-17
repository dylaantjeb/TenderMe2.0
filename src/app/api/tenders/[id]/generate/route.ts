import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateResponse, selfScore, checkCompliance } from '@/lib/ai/pipeline';
import { aiComplete } from '@/lib/ai/provider';
import { SYSTEM_PROMPTS, GENERATION_PROMPTS } from '@/lib/ai/prompts';

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

    // Create or find existing tender response
    let tenderResponse = await db.tenderResponse.findFirst({
      where: { tenderId: params.id, userId: session.user.id, status: 'GENERATING' },
    });

    if (!tenderResponse) {
      tenderResponse = await db.tenderResponse.create({
        data: {
          tenderId: params.id,
          userId: session.user.id,
          status: 'GENERATING',
          maxIterations,
        },
      });
    }

    await db.tender.update({
      where: { id: params.id },
      data: { status: 'GENERATING' },
    });

    // Process ONE criterion at a time to stay within Vercel timeout.
    // Find the first criterion without a response.
    const existingResponses = await db.criterionResponse.findMany({
      where: { tenderResponseId: tenderResponse.id },
      select: { criterionId: true },
    });
    const completedIds = new Set(existingResponses.map((r) => r.criterionId));
    const nextCriterion = tender.criteria.find((c) => !completedIds.has(c.id));

    if (!nextCriterion) {
      // All criteria done — finalize
      const allResponses = await db.criterionResponse.findMany({
        where: { tenderResponseId: tenderResponse.id },
        include: { criterion: true },
      });

      const totalWeight = allResponses.reduce((sum, r) => sum + (r.criterion.weight || 0), 0);
      const weightedSum = allResponses.reduce(
        (sum, r) => sum + (r.score || 0) * (r.criterion.weight || 0),
        0
      );
      const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

      await db.tenderResponse.update({
        where: { id: tenderResponse.id },
        data: { status: 'REVIEWED', overallScore },
      });

      await db.tender.update({
        where: { id: params.id },
        data: { status: 'REVIEW', overallScore },
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          tenderId: params.id,
          action: 'RESPONSES_GENERATED',
          resource: 'TenderResponse',
          resourceId: tenderResponse.id,
          details: {
            overallScore,
            criteriaScored: allResponses.length,
          },
        },
      });

      return NextResponse.json({
        success: true,
        done: true,
        data: {
          responseId: tenderResponse.id,
          overallScore,
          completed: allResponses.length,
          total: tender.criteria.length,
        },
      });
    }

    // Generate response for this one criterion
    const generated = await generateResponse(params.id, nextCriterion.id, session.user.id);

    // Score it
    let score = await selfScore(nextCriterion.id, generated.fullContent, session.user.id);

    // Compliance check
    let compliance = await checkCompliance(nextCriterion.id, generated.fullContent, session.user.id);

    let finalContent = compliance.passed
      ? generated.fullContent
      : compliance.correctedContent || generated.fullContent;

    // Iterate if score is low
    let iteration = 0;
    while (score.score < 8 && iteration < maxIterations) {
      iteration++;
      const { content: improved } = await aiComplete(
        GENERATION_PROMPTS.improveResponse(
          finalContent,
          score.weaknesses,
          score.improvements
        ),
        {
          systemPrompt: SYSTEM_PROMPTS.responseGenerator,
          maxTokens: 8192,
          temperature: 0.4,
        }
      );
      score = await selfScore(nextCriterion.id, improved, session.user.id);
      compliance = await checkCompliance(nextCriterion.id, improved, session.user.id);
      finalContent = compliance.passed ? improved : compliance.correctedContent || improved;
    }

    // Parse sections
    const sections = parseResponseSections(finalContent);

    // Store
    await db.criterionResponse.create({
      data: {
        tenderResponseId: tenderResponse.id,
        criterionId: nextCriterion.id,
        content: finalContent,
        understanding: sections.understanding,
        solution: sections.solution,
        evidence: sections.evidence,
        riskMitigation: sections.riskMitigation,
        measurableImpact: sections.measurableImpact,
        score: score.score,
        scoreJustification: score.justification,
        weaknesses: JSON.stringify(score.weaknesses),
        complianceNotes: JSON.stringify(compliance.issues),
        iterationNumber: iteration,
        status: 'REVIEWED',
      },
    });

    const completed = completedIds.size + 1;
    const total = tender.criteria.length;

    return NextResponse.json({
      success: true,
      done: false,
      data: {
        responseId: tenderResponse.id,
        criterionName: nextCriterion.name,
        score: score.score,
        completed,
        total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Generate responses error:', message, error);

    const isConfigError = message.includes('niet geconfigureerd') || message.includes('API_KEY');
    return NextResponse.json(
      { error: isConfigError ? message : `Generatie fout: ${message}` },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

function parseResponseSections(content: string) {
  const sections = {
    understanding: '',
    solution: '',
    evidence: '',
    riskMitigation: '',
    measurableImpact: '',
  };

  const sectionMap: Record<string, keyof typeof sections> = {
    'begrip': 'understanding',
    'concrete oplossing': 'solution',
    'bewijs': 'evidence',
    'onderbouwing': 'evidence',
    'bewijs en onderbouwing': 'evidence',
    'risicobeheersing': 'riskMitigation',
    'meetbaar resultaat': 'measurableImpact',
  };

  const headerRegex = /^##\s+(.+)$/gm;
  const headers: { name: string; index: number }[] = [];
  let match;

  while ((match = headerRegex.exec(content)) !== null) {
    headers.push({ name: match[1].toLowerCase().trim(), index: match.index });
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index + headers[i].name.length + 4;
    const end = i + 1 < headers.length ? headers[i + 1].index : content.length;
    const sectionContent = content.slice(start, end).trim();

    const key = sectionMap[headers[i].name];
    if (key) {
      sections[key] = sectionContent;
    }
  }

  return sections;
}
