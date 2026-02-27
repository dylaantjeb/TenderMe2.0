'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/utils';
import { ScoreMeter } from '@/components/scoring/score-meter';
import { RiskHeatmap } from '@/components/scoring/risk-heatmap';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Download,
  BarChart3,
} from 'lucide-react';

export default function ReviewPage() {
  const params = useParams();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCriterion, setSelectedCriterion] = useState(0);

  const tenderId = params.id as string;

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/tenders/${tenderId}`);
        const data = await res.json();
        if (data.success) setTender(data.data);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, [tenderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tender) return null;

  const latestResponse = tender.responses?.[0];
  if (!latestResponse) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Geen antwoorden beschikbaar. Genereer eerst EMVI antwoorden.
      </div>
    );
  }

  const criterionResponses = latestResponse.criterionResponses || [];
  const currentResponse = criterionResponses[selectedCriterion];

  // Build risk heatmap data
  const heatmapData = criterionResponses.map((cr: any) => ({
    name: cr.criterion?.name || 'Onbekend',
    score: cr.score || 0,
    weight: cr.criterion?.weight || 0,
  }));

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Score Review</h1>
          <p className="text-muted-foreground mt-1">{tender.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreMeter
            score={latestResponse.overallScore || 0}
            size={80}
            showLabel={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Score Overview */}
        <div className="col-span-4 space-y-4">
          {/* Score Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Score Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <ScoreMeter score={latestResponse.overallScore || 0} size={140} />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {criterionResponses.length} criteria beoordeeld
              </div>
            </CardContent>
          </Card>

          {/* Risk Heatmap */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risico Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskHeatmap criteria={heatmapData} />
            </CardContent>
          </Card>

          {/* Criteria Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {criterionResponses.map((cr: any, index: number) => (
                <button
                  key={cr.id}
                  onClick={() => setSelectedCriterion(index)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
                    selectedCriterion === index
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'h-6 w-6 rounded flex items-center justify-center text-xs font-bold',
                      getScoreBgColor(cr.score || 0)
                    )}
                  >
                    {(cr.score || 0).toFixed(0)}
                  </div>
                  <span className="flex-1 truncate">
                    {cr.criterion?.name || 'Criterium'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cr.criterion?.weight || 0}%
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Response Detail */}
        <div className="col-span-8">
          {currentResponse && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {currentResponse.criterion?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gewicht: {currentResponse.criterion?.weight}% | Max score:{' '}
                      {currentResponse.criterion?.maxScore}
                    </p>
                  </div>
                  <div className={cn('text-center', getScoreColor(currentResponse.score || 0))}>
                    <div className="text-3xl font-bold">
                      {(currentResponse.score || 0).toFixed(1)}
                    </div>
                    <div className="text-xs">{getScoreLabel(currentResponse.score || 0)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Score justification */}
                {currentResponse.scoreJustification && (
                  <div className="mb-6 rounded-lg bg-muted/50 p-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      Beoordelaarsinzicht
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentResponse.scoreJustification}
                    </p>
                  </div>
                )}

                {/* Weaknesses */}
                {currentResponse.weaknesses && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Verbeterpunten
                    </h4>
                    <ul className="space-y-1">
                      {JSON.parse(currentResponse.weaknesses).map((w: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-1">-</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Response content */}
                <div className="prose prose-sm max-w-none">
                  {currentResponse.content?.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={i} className="text-base font-semibold mt-6 mb-2 text-foreground">
                          {line.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (line.trim()) {
                      return (
                        <p key={i} className="text-sm text-muted-foreground mb-2 leading-relaxed">
                          {line}
                        </p>
                      );
                    }
                    return <br key={i} />;
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCriterion(Math.max(0, selectedCriterion - 1))}
                    disabled={selectedCriterion === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Vorige
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedCriterion + 1} / {criterionResponses.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCriterion(
                        Math.min(criterionResponses.length - 1, selectedCriterion + 1)
                      )
                    }
                    disabled={selectedCriterion === criterionResponses.length - 1}
                  >
                    Volgende
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
