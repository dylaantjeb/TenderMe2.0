'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, getScoreBgColor } from '@/lib/utils';
import {
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Scale,
  Lightbulb,
  Shield,
} from 'lucide-react';

export default function CriteriaPage() {
  const params = useParams();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchTender() {
      try {
        const res = await fetch(`/api/tenders/${params.id}`);
        const data = await res.json();
        if (data.success) setTender(data.data);
      } catch {
        console.error('Failed to fetch tender');
      } finally {
        setLoading(false);
      }
    }
    fetchTender();
  }, [params.id]);

  const toggleExpanded = (id: string) => {
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tender || !tender.criteria?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Geen criteria gevonden. Analyseer eerst de tender documenten.
      </div>
    );
  }

  const totalWeight = tender.criteria.reduce((sum: number, c: any) => sum + c.weight, 0);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Gunningscriteria</h1>
        <p className="text-muted-foreground mt-1">{tender.title}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{tender.criteria.length}</div>
            <div className="text-xs text-muted-foreground">Criteria</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">
              {tender.criteria.filter((c: any) => c.isKnockout).length}
            </div>
            <div className="text-xs text-muted-foreground">Knock-out eisen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{totalWeight}%</div>
            <div className="text-xs text-muted-foreground">Totaal gewicht</div>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Model */}
      {tender.context?.scoringModel && (
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <Scale className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">Scoringsmodel: </span>
              <Badge variant="info">{tender.context.scoringModel}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria List */}
      <div className="space-y-3">
        {tender.criteria.map((criterion: any) => {
          const isExpanded = expandedCriteria.has(criterion.id);
          const weightPercentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0;

          return (
            <Card key={criterion.id} className="overflow-hidden">
              <button
                onClick={() => toggleExpanded(criterion.id)}
                className="w-full text-left p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{criterion.name}</span>
                      {criterion.isKnockout && (
                        <Badge variant="destructive" className="text-2xs">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Knock-out
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-2xs">
                        {criterion.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={weightPercentage} className="h-1.5 flex-1 max-w-[200px]" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {criterion.weight}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Max {criterion.maxScore} punten
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4 ml-7 border-t">
                  {criterion.description && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Beschrijving
                      </h4>
                      <p className="text-sm">{criterion.description}</p>
                    </div>
                  )}

                  {criterion.knockoutReq && (
                    <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                      <h4 className="text-xs font-medium text-destructive uppercase tracking-wider mb-1">
                        Knock-out eis
                      </h4>
                      <p className="text-sm">{criterion.knockoutReq}</p>
                    </div>
                  )}

                  {criterion.children?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Subcriteria
                      </h4>
                      <div className="space-y-2">
                        {criterion.children.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 pl-4 py-1 border-l-2 border-muted"
                          >
                            <span className="text-sm flex-1">{sub.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {sub.weight}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* AI Insights */}
      {tender.context?.evaluatorPriorities && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Scoring Inzichten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tender.context.evaluatorPriorities}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
