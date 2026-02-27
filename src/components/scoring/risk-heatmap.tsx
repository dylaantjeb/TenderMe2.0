'use client';

import { cn } from '@/lib/utils';

interface RiskHeatmapProps {
  criteria: {
    name: string;
    score: number;
    weight: number;
  }[];
}

export function RiskHeatmap({ criteria }: RiskHeatmapProps) {
  const getHeatColor = (score: number) => {
    if (score >= 9) return 'bg-emerald-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-amber-500';
    if (score >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeatOpacity = (weight: number, maxWeight: number) => {
    const normalized = weight / maxWeight;
    return Math.max(0.4, normalized);
  };

  const maxWeight = Math.max(...criteria.map((c) => c.weight));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Criterium</span>
        <div className="flex items-center gap-4">
          <span>Score</span>
          <span>Gewicht</span>
          <span>Risico</span>
        </div>
      </div>
      {criteria
        .sort((a, b) => a.score - b.score) // Sort worst first
        .map((c, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm flex-1 truncate">{c.name}</span>
            <span className="text-sm font-mono w-12 text-right">{c.score.toFixed(1)}</span>
            <span className="text-sm font-mono w-12 text-right text-muted-foreground">
              {c.weight}%
            </span>
            <div
              className={cn(
                'h-4 rounded-sm transition-all',
                getHeatColor(c.score)
              )}
              style={{
                width: `${Math.max(20, c.weight * 2)}px`,
                opacity: getHeatOpacity(c.weight, maxWeight),
              }}
              title={`${c.name}: Score ${c.score}, Gewicht ${c.weight}%`}
            />
          </div>
        ))}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t">
        <span className="text-xs text-muted-foreground">Risico niveau:</span>
        <div className="flex items-center gap-2">
          {[
            { color: 'bg-red-500', label: 'Hoog' },
            { color: 'bg-amber-500', label: 'Midden' },
            { color: 'bg-blue-500', label: 'Laag' },
            { color: 'bg-emerald-500', label: 'Minimaal' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={cn('h-2.5 w-2.5 rounded-sm', item.color)} />
              <span className="text-2xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
