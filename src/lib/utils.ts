import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getScoreColor(score: number): string {
  if (score >= 9) return 'text-score-perfect';
  if (score >= 7) return 'text-score-high';
  if (score >= 5) return 'text-score-mid';
  return 'text-score-low';
}

export function getScoreBgColor(score: number): string {
  if (score >= 9) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 7) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Uitstekend';
  if (score >= 7) return 'Goed';
  if (score >= 5) return 'Voldoende';
  if (score >= 3) return 'Onvoldoende';
  return 'Zeer zwak';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateWeightedScore(
  scores: { score: number; weight: number }[]
): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}
