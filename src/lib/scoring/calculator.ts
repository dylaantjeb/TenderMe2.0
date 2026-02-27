import type { TenderScoreSummary, ScoreBreakdown } from '@/types';

interface CriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  maxScore: number;
  score: number;
}

/**
 * Calculate comprehensive tender score summary
 */
export function calculateTenderScore(
  criterionScores: CriterionScore[]
): TenderScoreSummary {
  if (criterionScores.length === 0) {
    return {
      overallScore: 0,
      maxPossibleScore: 0,
      percentage: 0,
      breakdown: [],
      strengths: [],
      weaknesses: [],
      riskLevel: 'high',
    };
  }

  const totalWeight = criterionScores.reduce((sum, c) => sum + c.weight, 0);

  const breakdown: ScoreBreakdown[] = criterionScores.map((c) => {
    const normalizedScore = (c.score / c.maxScore) * 10;
    const weightedScore = (normalizedScore * c.weight) / totalWeight;
    const maxWeightedScore = (10 * c.weight) / totalWeight;

    return {
      criterionId: c.criterionId,
      criterionName: c.criterionName,
      weight: c.weight,
      score: c.score,
      weightedScore: Math.round(weightedScore * 100) / 100,
      maxWeightedScore: Math.round(maxWeightedScore * 100) / 100,
      percentage: Math.round((c.score / c.maxScore) * 100),
    };
  });

  const overallScore = breakdown.reduce((sum, b) => sum + b.weightedScore, 0);
  const maxPossibleScore = breakdown.reduce(
    (sum, b) => sum + b.maxWeightedScore,
    0
  );

  // Identify strengths (score >= 8)
  const strengths = breakdown
    .filter((b) => b.score >= 8)
    .sort((a, b) => b.score - a.score)
    .map((b) => `${b.criterionName} (${b.score.toFixed(1)}/${criterionScores.find(c => c.criterionId === b.criterionId)?.maxScore || 10})`);

  // Identify weaknesses (score < 7)
  const weaknesses = breakdown
    .filter((b) => b.score < 7)
    .sort((a, b) => a.score - b.score)
    .map((b) => `${b.criterionName} (${b.score.toFixed(1)}/${criterionScores.find(c => c.criterionId === b.criterionId)?.maxScore || 10})`);

  // Determine risk level
  const avgScore = overallScore;
  let riskLevel: 'low' | 'medium' | 'high';
  if (avgScore >= 8) riskLevel = 'low';
  else if (avgScore >= 6) riskLevel = 'medium';
  else riskLevel = 'high';

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    maxPossibleScore: Math.round(maxPossibleScore * 100) / 100,
    percentage: Math.round((overallScore / maxPossibleScore) * 100),
    breakdown,
    strengths,
    weaknesses,
    riskLevel,
  };
}

/**
 * Calculate score impact of changing a single criterion's score
 */
export function calculateScoreImpact(
  currentScores: CriterionScore[],
  criterionId: string,
  newScore: number
): { oldOverall: number; newOverall: number; delta: number } {
  const currentSummary = calculateTenderScore(currentScores);

  const updatedScores = currentScores.map((c) =>
    c.criterionId === criterionId ? { ...c, score: newScore } : c
  );
  const newSummary = calculateTenderScore(updatedScores);

  return {
    oldOverall: currentSummary.overallScore,
    newOverall: newSummary.overallScore,
    delta: Math.round((newSummary.overallScore - currentSummary.overallScore) * 100) / 100,
  };
}
