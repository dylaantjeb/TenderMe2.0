import { aiComplete, aiCompleteJSON, type AICompletionOptions } from './provider';
import { SYSTEM_PROMPTS, EXTRACTION_PROMPTS, GENERATION_PROMPTS } from './prompts';
import type {
  AIContextAnalysis,
  CriteriaIntelligence,
  GeneratedResponse,
  SelfScore,
  ComplianceResult,
  ExtractedCriteria,
} from '@/types';
import { db } from '@/lib/db';

// ============================================
// LAYER 1: CONTEXT BUILDER
// ============================================

export async function buildContext(
  documentText: string,
  tenderId: string,
  userId: string
): Promise<AIContextAnalysis> {
  const startTime = Date.now();

  const { data, usage } = await aiCompleteJSON<AIContextAnalysis>(
    EXTRACTION_PROMPTS.analyzeContext(documentText),
    {
      systemPrompt: SYSTEM_PROMPTS.contextBuilder,
      maxTokens: 4096,
      temperature: 0.2,
      role: 'analysis',
    }
  );

  // Store context in database
  await db.tenderContext.upsert({
    where: { tenderId },
    create: {
      tenderId,
      scope: data.scope,
      objectives: JSON.stringify(data.objectives),
      constraints: JSON.stringify(data.constraints),
      risks: JSON.stringify(data.risks),
      politicalSensitivity: data.politicalSensitivity,
      timeline: data.timeline,
      stakeholders: JSON.stringify(data.stakeholders),
    },
    update: {
      scope: data.scope,
      objectives: JSON.stringify(data.objectives),
      constraints: JSON.stringify(data.constraints),
      risks: JSON.stringify(data.risks),
      politicalSensitivity: data.politicalSensitivity,
      timeline: data.timeline,
      stakeholders: JSON.stringify(data.stakeholders),
    },
  });

  // Log AI usage
  await logAIUsage(userId, 'context_analysis', usage, startTime);

  return data;
}

// ============================================
// LAYER 2: CRITERIA INTELLIGENCE ENGINE
// ============================================

export async function analyzeCriteria(
  documentText: string,
  tenderId: string,
  userId: string
): Promise<{ extracted: ExtractedCriteria; intelligence: CriteriaIntelligence }> {
  const startTime = Date.now();

  // Extract criteria
  const { data: extracted, usage: extractUsage } = await aiCompleteJSON<ExtractedCriteria>(
    EXTRACTION_PROMPTS.extractCriteria(documentText),
    {
      systemPrompt: SYSTEM_PROMPTS.criteriaIntelligence,
      maxTokens: 8192,
      temperature: 0.1,
      role: 'analysis',
    }
  );

  // Store criteria in database
  for (const criterion of extracted.criteria) {
    const created = await db.criterion.create({
      data: {
        tender: { connect: { id: tenderId } },
        name: criterion.name,
        description: criterion.description || '',
        type: (criterion.type as any) || 'QUALITY',
        weight: criterion.weight ?? 0,
        maxScore: criterion.maxScore ?? 10,
        isKnockout: criterion.isKnockout ?? false,
        knockoutReq: criterion.knockoutRequirement || null,
        scoringMethod: extracted.scoringMethodology || null,
      },
    });

    // Create sub-criteria
    if (criterion.subCriteria?.length) {
      for (const sub of criterion.subCriteria) {
        await db.criterion.create({
          data: {
            tender: { connect: { id: tenderId } },
            name: sub.name,
            description: sub.description || '',
            type: (criterion.type as any) || 'QUALITY',
            weight: sub.weight ?? 0,
            parent: { connect: { id: created.id } },
          },
        });
      }
    }
  }

  // Analyze scoring model
  const criteriaText = extracted.criteria
    .map((c) => `${c.name} (${c.weight}%): ${c.description}`)
    .join('\n');

  const { data: intelligence, usage: intelligenceUsage } =
    await aiCompleteJSON<CriteriaIntelligence>(
      EXTRACTION_PROMPTS.analyzeScoringModel(criteriaText),
      {
        systemPrompt: SYSTEM_PROMPTS.criteriaIntelligence,
        maxTokens: 4096,
        temperature: 0.2,
        role: 'analysis',
      }
    );

  // Update tender context with scoring intelligence
  await db.tenderContext.update({
    where: { tenderId },
    data: {
      scoringModel: intelligence.scoringModel,
      evaluatorPriorities: JSON.stringify(intelligence.evaluatorPriorities),
      scoreMultipliers: intelligence.scoreMultipliers,
    },
  });

  await logAIUsage(userId, 'criteria_extraction', extractUsage, startTime);
  await logAIUsage(userId, 'criteria_intelligence', intelligenceUsage, startTime);

  return { extracted, intelligence };
}

// ============================================
// LAYER 3: SCORE-OPTIMIZED GENERATION
// ============================================

export async function generateResponse(
  tenderId: string,
  criterionId: string,
  userId: string
): Promise<GeneratedResponse> {
  const startTime = Date.now();

  // Fetch criterion and context
  const criterion = await db.criterion.findUniqueOrThrow({
    where: { id: criterionId },
  });

  const context = await db.tenderContext.findUnique({
    where: { tenderId },
  });

  const contextStr = context
    ? `Scope: ${context.scope}\nObjectieven: ${context.objectives}\nRisico's: ${context.risks}\nTimeline: ${context.timeline}`
    : 'Geen context beschikbaar.';

  const scoringStr = context
    ? `Scoringsmodel: ${context.scoringModel}\nPrioriteiten: ${context.evaluatorPriorities}`
    : 'Geen scoring inzichten beschikbaar.';

  const { content, usage } = await aiComplete(
    GENERATION_PROMPTS.generateResponse(
      criterion.name,
      criterion.description || '',
      contextStr,
      scoringStr
    ),
    {
      systemPrompt: SYSTEM_PROMPTS.responseGenerator,
      maxTokens: 8192,
      temperature: 0.4,
      role: 'generation',
    }
  );

  // Parse structured sections from the response
  const sections = parseResponseSections(content);

  await logAIUsage(userId, 'response_generation', usage, startTime);

  return {
    criterionId,
    understanding: sections.understanding,
    solution: sections.solution,
    evidence: sections.evidence,
    riskMitigation: sections.riskMitigation,
    measurableImpact: sections.measurableImpact,
    fullContent: content,
  };
}

// ============================================
// LAYER 4: SELF-SCORING ENGINE
// ============================================

export async function selfScore(
  criterionId: string,
  responseContent: string,
  userId: string
): Promise<SelfScore> {
  const startTime = Date.now();

  const criterion = await db.criterion.findUniqueOrThrow({
    where: { id: criterionId },
  });

  const { data, usage } = await aiCompleteJSON<SelfScore>(
    GENERATION_PROMPTS.selfScore(
      criterion.name,
      criterion.description || '',
      responseContent,
      criterion.maxScore
    ),
    {
      systemPrompt: SYSTEM_PROMPTS.selfScorer,
      maxTokens: 4096,
      temperature: 0.3,
      role: 'analysis',
    }
  );

  await logAIUsage(userId, 'self_scoring', usage, startTime);

  return { ...data, criterionId };
}

// ============================================
// LAYER 5: EMVI COMPLIANCE FILTER
// ============================================

export async function checkCompliance(
  criterionId: string,
  responseContent: string,
  userId: string
): Promise<ComplianceResult> {
  const startTime = Date.now();

  const { data, usage } = await aiCompleteJSON<ComplianceResult>(
    GENERATION_PROMPTS.complianceCheck(responseContent),
    {
      systemPrompt: SYSTEM_PROMPTS.complianceFilter,
      maxTokens: 8192,
      temperature: 0.1,
      role: 'analysis',
    }
  );

  await logAIUsage(userId, 'compliance_check', usage, startTime);

  return { ...data, criterionId };
}

// ============================================
// FULL PIPELINE ORCHESTRATOR
// ============================================

export async function runFullPipeline(
  tenderId: string,
  userId: string,
  maxIterations = 2
): Promise<{
  responseId: string;
  overallScore: number;
  criterionScores: SelfScore[];
}> {
  const tender = await db.tender.findUniqueOrThrow({
    where: { id: tenderId },
    include: { documents: true, criteria: { where: { parentId: null } } },
  });

  // Combine document text
  const fullText = tender.documents
    .map((d) => d.extractedText)
    .filter(Boolean)
    .join('\n\n');

  // Update status
  await db.tender.update({
    where: { id: tenderId },
    data: { status: 'ANALYZING' },
  });

  // Layer 1: Build context
  await buildContext(fullText, tenderId, userId);

  // Layer 2: Analyze criteria (skip if already extracted)
  if (tender.criteria.length === 0) {
    await analyzeCriteria(fullText, tenderId, userId);
  }

  // Refresh criteria
  const criteria = await db.criterion.findMany({
    where: { tenderId, parentId: null },
  });

  // Create tender response
  const tenderResponse = await db.tenderResponse.create({
    data: {
      tenderId,
      userId,
      status: 'GENERATING',
      maxIterations,
    },
  });

  await db.tender.update({
    where: { id: tenderId },
    data: { status: 'GENERATING' },
  });

  const allScores: SelfScore[] = [];

  for (const criterion of criteria) {
    // Layer 3: Generate response
    let generated = await generateResponse(tenderId, criterion.id, userId);

    // Layer 4: Self-score
    let score = await selfScore(criterion.id, generated.fullContent, userId);

    // Layer 5: Compliance check
    let compliance = await checkCompliance(criterion.id, generated.fullContent, userId);

    // Apply compliance corrections
    let finalContent = compliance.passed
      ? generated.fullContent
      : compliance.correctedContent || generated.fullContent;

    // Iterate if score is below threshold
    let iteration = 0;
    while (score.score < 8 && iteration < maxIterations) {
      iteration++;

      // Improve response
      const { content: improved, usage } = await aiComplete(
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

      await logAIUsage(userId, 'response_iteration', usage, Date.now());

      // Re-score
      score = await selfScore(criterion.id, improved, userId);

      // Re-check compliance
      compliance = await checkCompliance(criterion.id, improved, userId);
      finalContent = compliance.passed
        ? improved
        : compliance.correctedContent || improved;
    }

    // Parse final sections
    const sections = parseResponseSections(finalContent);

    // Store criterion response
    await db.criterionResponse.create({
      data: {
        tenderResponseId: tenderResponse.id,
        criterionId: criterion.id,
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

    allScores.push(score);
  }

  // Calculate overall score
  const overallScore = calculateOverallScore(criteria, allScores);

  // Update tender response
  await db.tenderResponse.update({
    where: { id: tenderResponse.id },
    data: {
      status: 'REVIEWED',
      overallScore,
      iterationCount: maxIterations,
    },
  });

  await db.tender.update({
    where: { id: tenderId },
    data: { status: 'REVIEW', overallScore },
  });

  return {
    responseId: tenderResponse.id,
    overallScore,
    criterionScores: allScores,
  };
}

// ============================================
// HELPERS
// ============================================

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

function calculateOverallScore(
  criteria: { id: string; weight: number; maxScore: number }[],
  scores: SelfScore[]
): number {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const criterion of criteria) {
    const scoreEntry = scores.find((s) => s.criterionId === criterion.id);
    if (scoreEntry) {
      const normalizedScore = (scoreEntry.score / criterion.maxScore) * 10;
      weightedSum += normalizedScore * criterion.weight;
    }
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

async function logAIUsage(
  userId: string,
  operation: string,
  usage: { inputTokens: number; outputTokens: number },
  startTime: number
) {
  const costPerInputToken = 0.000003; // Approximate
  const costPerOutputToken = 0.000015;
  const cost = usage.inputTokens * costPerInputToken + usage.outputTokens * costPerOutputToken;

  await db.aIUsageLog.create({
    data: {
      userId,
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      operation,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost,
      latencyMs: Date.now() - startTime,
    },
  });
}
