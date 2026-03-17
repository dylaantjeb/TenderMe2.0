'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getScoreLabel, getScoreBgColor } from '@/lib/utils';
import {
  Plus,
  Search,
  FileText,
  Clock,
  Target,
  Upload,
  FolderOpen,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { FileUploadDialog } from '@/components/tender/file-upload-dialog';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  DRAFT: { label: 'Concept', variant: 'secondary' },
  IMPORTING: { label: 'Importeren', variant: 'info' },
  ANALYZING: { label: 'Analyseren', variant: 'info' },
  CRITERIA_EXTRACTED: { label: 'Criteria klaar', variant: 'warning' },
  GENERATING: { label: 'Genereren', variant: 'info' },
  REVIEW: { label: 'Beoordeling', variant: 'warning' },
  SCORING: { label: 'Scoring', variant: 'info' },
  FINAL: { label: 'Definitief', variant: 'success' },
  SUBMITTED: { label: 'Ingediend', variant: 'success' },
  ARCHIVED: { label: 'Archief', variant: 'secondary' },
};

export default function TendersPage() {
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/tenders?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setTenders(data.data);
    } catch (error) {
      console.error('Failed to fetch tenders:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenders</h1>
          <p className="text-muted-foreground mt-1">
            Beheer en optimaliseer uw aanbestedingen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload documenten
          </Button>
          <Link href="/tenders/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe tender
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op titel, referentie of aanbesteder..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tender Cards */}
      {tenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Geen tenders gevonden</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Upload aanbestedingsdocumenten of maak een nieuwe tender aan om te beginnen.
          </p>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload documenten
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenders.map((tender: any) => {
            const status = STATUS_LABELS[tender.status] || STATUS_LABELS.DRAFT;
            return (
              <Link key={tender.id} href={`/tenders/${tender.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {tender.title}
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {tender.referenceNumber && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {tender.referenceNumber}
                            </span>
                          )}
                          {tender.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(tender.deadline)}
                            </span>
                          )}
                          {tender.criteria?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {tender.criteria.length} criteria
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {tender.overallScore && (
                          <div
                            className={cn(
                              'rounded-lg border px-4 py-2 text-center',
                              getScoreBgColor(tender.overallScore)
                            )}
                          >
                            <div className="text-2xl font-bold">{tender.overallScore.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">
                              {getScoreLabel(tender.overallScore)}
                            </div>
                          </div>
                        )}
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <FileUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
