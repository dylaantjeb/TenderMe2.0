'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Brain,
  Target,
  Shield,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
  AlertCircle,
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 'context',
    name: 'Context Analyse',
    description: 'Scope, doelstellingen en risico\'s analyseren',
    icon: Brain,
  },
  {
    id: 'criteria',
    name: 'Criteria Intelligence',
    description: 'Scoringsmodel en beoordelaarsprioriteiten detecteren',
    icon: Target,
  },
  {
    id: 'generation',
    name: 'Score-Geoptimaliseerde Generatie',
    description: 'Professionele EMVI antwoorden genereren',
    icon: Sparkles,
  },
  {
    id: 'scoring',
    name: 'Zelf-Scoring & Iteratie',
    description: 'Antwoorden beoordelen en verbeteren',
    icon: Zap,
  },
  {
    id: 'compliance',
    name: 'EMVI Compliance Check',
    description: 'Marketing taal en onverifieerbare claims verwijderen',
    icon: Shield,
  },
];

interface CriterionResult {
  name: string;
  score: number;
}

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [iterations, setIterations] = useState(2);
  const [error, setError] = useState('');
  const [currentCriterion, setCurrentCriterion] = useState('');
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [criterionResults, setCriterionResults] = useState<CriterionResult[]>([]);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    setCriterionResults([]);
    setResult(null);

    try {
      // Keep calling the endpoint until all criteria are done
      let done = false;
      while (!done) {
        const res = await fetch(`/api/tenders/${params.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxIterations: iterations }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Generatie mislukt');
          break;
        }

        if (data.done) {
          // All criteria processed
          done = true;
          setResult(data.data);
        } else {
          // One criterion completed
          const d = data.data;
          setCurrentCriterion(d.criterionName);
          setCompleted(d.completed);
          setTotal(d.total);
          setCriterionResults((prev) => [
            ...prev,
            { name: d.criterionName, score: d.score },
          ]);
        }
      }
    } catch {
      setError('Verbinding mislukt. Probeer het opnieuw.');
    } finally {
      setGenerating(false);
    }
  }

  const progress = total > 0 ? (completed / total) * 100 : 0;
  // Map progress to pipeline steps
  const pipelineProgress = result
    ? PIPELINE_STEPS.length
    : generating && total > 0
    ? Math.min(Math.floor((completed / total) * PIPELINE_STEPS.length) + 2, PIPELINE_STEPS.length - 1)
    : generating
    ? 0
    : -1;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          EMVI Antwoorden Genereren
        </h1>
        <p className="text-muted-foreground">
          Onze 5-laags AI pipeline genereert score-geoptimaliseerde antwoorden
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Pipeline Visualization */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, index) => {
              const isActive = index === pipelineProgress;
              const isComplete = index < pipelineProgress;
              const isPending = index > pipelineProgress;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 rounded-lg p-3 transition-all ${
                    isActive ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isComplete
                        ? 'bg-emerald-500/10'
                        : isActive
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <step.icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isPending ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {step.name}
                      </span>
                      {isActive && (
                        <span className="text-xs text-primary animate-pulse">
                          Verwerken...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    L{index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {generating && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {currentCriterion
                    ? `Criterium: ${currentCriterion}`
                    : 'Starten...'}
                </span>
                <span>
                  {completed}/{total || '?'} criteria
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Criterion scores as they come in */}
      {criterionResults.length > 0 && !result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Tussentijdse Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criterionResults.map((cr, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{cr.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      cr.score >= 8
                        ? 'text-emerald-500'
                        : cr.score >= 6
                        ? 'text-blue-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {cr.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {!generating && !result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Configuratie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Iteraties</span>
                <p className="text-xs text-muted-foreground">
                  Aantal verbeterrondes per criterium (meer = betere score, langer)
                </p>
              </div>
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value={1}>1 iteratie (snel)</option>
                <option value={2}>2 iteraties (aanbevolen)</option>
                <option value={3}>3 iteraties (maximaal)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action / Result */}
      <div className="text-center">
        {!generating && !result && (
          <Button size="xl" variant="premium" onClick={handleGenerate}>
            <Sparkles className="h-5 w-5 mr-2" />
            Start Generatie Pipeline
          </Button>
        )}

        {result && (
          <Card className="text-left">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-lg">Generatie Voltooid</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.completed || criterionResults.length} criteria beoordeeld
                  </p>
                </div>
              </div>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-emerald-500">
                  {result.overallScore?.toFixed(1) || '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Totale score /10
                </div>
              </div>

              {/* Final scores per criterion */}
              {criterionResults.length > 0 && (
                <div className="mb-6 space-y-2">
                  {criterionResults.map((cr, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                      <span className="truncate flex-1">{cr.name}</span>
                      <span
                        className={`font-mono font-bold ${
                          cr.score >= 8
                            ? 'text-emerald-500'
                            : cr.score >= 6
                            ? 'text-blue-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {cr.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/tenders/${params.id}/review`)}
                >
                  Bekijk Scores
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/tenders/${params.id}/export`)}
                >
                  Exporteren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
