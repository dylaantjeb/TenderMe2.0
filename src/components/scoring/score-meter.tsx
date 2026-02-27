'use client';

import { cn } from '@/lib/utils';

interface ScoreMeterProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ScoreMeter({
  score,
  maxScore = 10,
  size = 100,
  strokeWidth = 8,
  className,
  showLabel = true,
}: ScoreMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(score / maxScore, 1);
  const offset = circumference - percentage * circumference;

  const getColor = () => {
    if (score >= 9) return '#10b981'; // emerald-500
    if (score >= 7) return '#3b82f6'; // blue-500
    if (score >= 5) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getLabel = () => {
    if (score >= 9) return 'Uitstekend';
    if (score >= 7) return 'Goed';
    if (score >= 5) return 'Voldoende';
    if (score >= 3) return 'Matig';
    return 'Onvoldoende';
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-meter transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums"
          style={{ fontSize: size * 0.28, color: getColor() }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: size * 0.1 }}>
          /{maxScore}
        </span>
      </div>
      {showLabel && (
        <span
          className="mt-1 font-medium"
          style={{ fontSize: size * 0.11, color: getColor() }}
        >
          {getLabel()}
        </span>
      )}
    </div>
  );
}
