import type {
  Tender,
  Criterion,
  TenderResponse,
  CriterionResponse,
  TenderContext,
  Document,
  User,
  Organization,
} from '@prisma/client';

// ============================================
// TENDER TYPES
// ============================================

export type TenderWithRelations = Tender & {
  documents: Document[];
  criteria: CriterionWithChildren[];
  responses: TenderResponseWithCriteria[];
  context: TenderContext | null;
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

export type CriterionWithChildren = Criterion & {
  children: Criterion[];
  responses: CriterionResponse[];
};

export type TenderResponseWithCriteria = TenderResponse & {
  criterionResponses: CriterionResponseWithCriterion[];
};

export type CriterionResponseWithCriterion = CriterionResponse & {
  criterion: Criterion;
};

// ============================================
// AI PIPELINE TYPES
// ============================================

export interface AIContextAnalysis {
  scope: string;
  objectives: string[];
  constraints: string[];
  risks: string[];
  politicalSensitivity: string;
  timeline: string;
  stakeholders: string[];
}

export interface CriteriaIntelligence {
  scoringModel: string;
  evaluatorPriorities: string[];
  scoreMultipliers: Record<string, number>;
  hiddenPatterns: string[];
}

export interface GeneratedResponse {
  criterionId: string;
  understanding: string;
  solution: string;
  evidence: string;
  riskMitigation: string;
  measurableImpact: string;
  fullContent: string;
}

export interface SelfScore {
  criterionId: string;
  score: number;
  justification: string;
  weaknesses: string[];
  improvements: string[];
}

export interface ComplianceResult {
  criterionId: string;
  passed: boolean;
  issues: ComplianceIssue[];
  correctedContent?: string;
}

export interface ComplianceIssue {
  type: 'marketing_language' | 'unverifiable_claim' | 'tone' | 'testability' | 'format';
  description: string;
  location: string;
  suggestion: string;
}

// ============================================
// INGESTION TYPES
// ============================================

export interface ParsedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    pageCount?: number;
    entryCount?: number;
    ocrApplied: boolean;
    [key: string]: unknown;
  };
}

export interface ExtractedCriteria {
  criteria: {
    name: string;
    description: string;
    type: string;
    weight: number;
    maxScore: number;
    isKnockout: boolean;
    knockoutRequirement?: string;
    subCriteria: {
      name: string;
      description: string;
      weight: number;
    }[];
  }[];
  submissionConstraints: string[];
  scoringMethodology: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// SCORE TYPES
// ============================================

export interface ScoreBreakdown {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  weightedScore: number;
  maxWeightedScore: number;
  percentage: number;
}

export interface TenderScoreSummary {
  overallScore: number;
  maxPossibleScore: number;
  percentage: number;
  breakdown: ScoreBreakdown[];
  strengths: string[];
  weaknesses: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface PricingPlan {
  id: string;
  name: string;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    tendersPerMonth: number;
    usersIncluded: number;
    aiGenerationsPerTender: number;
    storageGb: number;
  };
  stripePriceId: string;
}
