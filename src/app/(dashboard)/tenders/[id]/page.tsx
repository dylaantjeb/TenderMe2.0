'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatDate, getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  FileText,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Download,
  Upload,
  BarChart3,
  Loader2,
  Eye,
  Shield,
} from 'lucide-react';
import { ScoreMeter } from '@/components/scoring/score-meter';
import { FileUploadDialog } from '@/components/tender/file-upload-dialog';

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const tenderId = params.id as string;

  useEffect(() => {
    fetchTender();
  }, [tenderId]);

  async function fetchTender() {
    try {
      const res = await fetch(`/api/tenders/${tenderId}`);
      const data = await res.json();
      if (data.success) setTender(data.data);
    } catch (error) {
      console.error('Failed to fetch tender:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/tenders/${tenderId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchTender();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Fout bij analyseren');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tenders/${tenderId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxIterations: 2 }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTender();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Fout bij genereren');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(format: 'docx' | 'pdf') {
    try {
      const res = await fetch(`/api/tenders/${tenderId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tender.title}_EMVI.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Fout bij exporteren');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tender) {
    return <div className="text-center py-20 text-muted-foreground">Tender niet gevonden</div>;
  }

  const latestResponse = tender.responses?.[0];
  const hasDocuments = tender.documents?.length > 0;
  const hasCriteria = tender.criteria?.length > 0;
  const hasResponses = tender.responses?.length > 0;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{tender.title}</h1>
            <Badge variant={tender.status === 'REVIEW' || tender.status === 'FINAL' ? 'success' : 'secondary'}>
              {tender.status}
            </Badge>
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
                Deadline: {formatDate(tender.deadline)}
              </span>
            )}
            {tender.contractingAuth && (
              <span>{tender.contractingAuth}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasResponses && (
            <>
              <Button variant="outline" onClick={() => handleExport('docx')}>
                <Download className="h-4 w-4 mr-2" />
                Word
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overall Score */}
      {tender.overallScore && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <ScoreMeter score={tender.overallScore} size={120} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Totale Score</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Gewogen gemiddelde over alle gunningscriteria
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant={tender.overallScore >= 8 ? 'success' : tender.overallScore >= 6 ? 'warning' : 'destructive'}>
                    {getScoreLabel(tender.overallScore)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tender.criteria?.length || 0} criteria beoordeeld
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Step 1: Documents */}
        <Card className={cn(hasDocuments && 'border-emerald-500/30')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold',
                hasDocuments ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {hasDocuments ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <h4 className="font-medium text-sm">Documenten</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {hasDocuments
                ? `${tender.documents.length} bestand(en) geüpload`
                : 'Upload aanbestedingsdocumenten'}
            </p>
            <Button
              size="sm"
              variant={hasDocuments ? 'outline' : 'default'}
              className="w-full"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {hasDocuments ? 'Meer uploaden' : 'Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Analyze */}
        <Card className={cn(hasCriteria && 'border-emerald-500/30')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold',
                hasCriteria ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {hasCriteria ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <h4 className="font-medium text-sm">Analyseren</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {hasCriteria
                ? `${tender.criteria.length} criteria geëxtraheerd`
                : 'AI analyseert criteria'}
            </p>
            <Button
              size="sm"
              variant={hasCriteria ? 'outline' : 'default'}
              className="w-full"
              onClick={handleAnalyze}
              disabled={!hasDocuments || analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5 mr-1.5" />
              )}
              {analyzing ? 'Analyseren...' : hasCriteria ? 'Opnieuw' : 'Analyseren'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Generate */}
        <Card className={cn(hasResponses && 'border-emerald-500/30')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold',
                hasResponses ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {hasResponses ? <CheckCircle2 className="h-4 w-4" /> : '3'}
              </div>
              <h4 className="font-medium text-sm">Genereren</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {hasResponses
                ? `Score: ${latestResponse.overallScore?.toFixed(1) || '-'}/10`
                : 'EMVI antwoorden genereren'}
            </p>
            <Button
              size="sm"
              variant={hasResponses ? 'outline' : 'default'}
              className="w-full"
              onClick={handleGenerate}
              disabled={!hasCriteria || generating}
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {generating ? 'Genereren...' : hasResponses ? 'Opnieuw' : 'Genereren'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Export */}
        <Card className={cn(tender.status === 'FINAL' && 'border-emerald-500/30')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold',
                tender.status === 'FINAL' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {tender.status === 'FINAL' ? <CheckCircle2 className="h-4 w-4" /> : '4'}
              </div>
              <h4 className="font-medium text-sm">Exporteren</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Download als Word of PDF
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleExport('docx')}
              disabled={!hasResponses}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exporteren
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Criteria Breakdown */}
      {hasCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Gunningscriteria
            </CardTitle>
            <CardDescription>
              Geëxtraheerde criteria met wegingen en scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tender.criteria.map((criterion: any) => {
                const response = latestResponse?.criterionResponses?.find(
                  (cr: any) => cr.criterionId === criterion.id
                );
                const score = response?.score || 0;

                return (
                  <div
                    key={criterion.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{criterion.name}</span>
                        {criterion.isKnockout && (
                          <Badge variant="destructive" className="text-2xs">Knock-out</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Gewicht: {criterion.weight}%</span>
                        <span>Max: {criterion.maxScore} punten</span>
                        {criterion.children?.length > 0 && (
                          <span>{criterion.children.length} subcriteria</span>
                        )}
                      </div>
                    </div>
                    {score > 0 && (
                      <div className={cn('text-center px-3', getScoreColor(score))}>
                        <div className="text-xl font-bold">{score.toFixed(1)}</div>
                        <div className="text-2xs text-muted-foreground">
                          /{criterion.maxScore}
                        </div>
                      </div>
                    )}
                    {response && (
                      <Link href={`/tenders/${tenderId}/review`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Bekijk
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Summary */}
      {tender.context && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {tender.context.scope && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Scope</h4>
                  <p className="text-sm text-muted-foreground">{tender.context.scope}</p>
                </div>
              )}
              {tender.context.timeline && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Tijdlijn</h4>
                  <p className="text-sm text-muted-foreground">{tender.context.timeline}</p>
                </div>
              )}
              {tender.context.risks && (
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Risico's
                  </h4>
                  <p className="text-sm text-muted-foreground">{tender.context.risks}</p>
                </div>
              )}
              {tender.context.scoringModel && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Scoringsmodel</h4>
                  <Badge variant="info">{tender.context.scoringModel}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Disclaimer */}
      <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <p>
          AI-gegenereerde antwoorden dienen als professioneel concept. Controleer en pas aan voordat u indient.
          TenderMe garandeert geen specifieke scores. Gebruik is onderworpen aan onze gebruiksvoorwaarden.
        </p>
      </div>

      <FileUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} tenderId={tenderId} />
    </div>
  );
}
