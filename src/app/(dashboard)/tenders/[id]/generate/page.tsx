'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    name: 'Zelf-Scoring',
    description: 'Antwoorden beoordelen en itereren',
    icon: Zap,
  },
  {
    id: 'compliance',
    name: 'EMVI Compliance Check',
    description: 'Marketing taal en onverifieerbare claims verwijderen',
    icon: Shield,
  },
];

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [iterations, setIterations] = useState(2);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    setGenerating(true);
    setCurrentStep(0);

    // Simulate step progression (actual work happens server-side)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= PIPELINE_STEPS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 8000);

    try {
      const res = await fetch(`/api/tenders/${params.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxIterations: iterations }),
      });

      clearInterval(stepInterval);
      setCurrentStep(PIPELINE_STEPS.length);

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      clearInterval(stepInterval);
      alert('Fout bij genereren van antwoorden');
    } finally {
      setGenerating(false);
    }
  }

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

      {/* Pipeline Visualization */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isComplete = index < currentStep || (result && currentStep >= PIPELINE_STEPS.length);
              const isPending = index > currentStep;

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
            <Progress
              value={((currentStep + 1) / PIPELINE_STEPS.length) * 100}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

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
                    {result.criterionScores?.length || 0} criteria beoordeeld
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
