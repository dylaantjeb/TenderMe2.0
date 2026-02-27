'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  File,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function ExportPage() {
  const params = useParams();
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(format: 'docx' | 'pdf') {
    setExporting(format);
    try {
      const res = await fetch(`/api/tenders/${params.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Export mislukt');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EMVI_Inschrijving.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Fout bij exporteren');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Exporteren</h1>
        <p className="text-muted-foreground mt-1">
          Download uw EMVI inschrijving in professioneel format
        </p>
      </div>

      <div className="grid gap-4">
        {/* Word Export */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Microsoft Word (.docx)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Professioneel gestructureerd Word document met titel pagina,
                  inhoudsopgave, gestructureerde antwoorden per criterium en scores.
                  Bewerkbaar format voor verdere aanpassingen.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Bewerkbaar', 'Gestructureerd', 'Kopteksten & voetteksten', 'Inhoudsopgave'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-2xs">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button onClick={() => handleExport('docx')} disabled={exporting !== null}>
                  {exporting === 'docx' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Word
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Export */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <File className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">PDF Document (.pdf)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Professioneel opgemaakt PDF document, geschikt voor directe
                  indiening. Vaste opmaak die op elk systeem identiek wordt weergegeven.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Vast format', 'Print-ready', 'Universeel', 'Archiveerbaar'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-2xs">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                >
                  {exporting === 'pdf' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Notes */}
      <div className="mt-6 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
        <p>
          Geëxporteerde documenten bevatten een AI-disclaimer conform onze gebruiksvoorwaarden.
        </p>
        <p>
          Controleer en pas het document aan voordat u het indient bij de aanbestedende dienst.
        </p>
      </div>
    </div>
  );
}
