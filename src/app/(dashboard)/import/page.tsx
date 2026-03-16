'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Upload,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ExternalLink,
} from 'lucide-react';

type ImportStep = 'source' | 'details' | 'upload' | 'processing';

interface TenderDetails {
  title: string;
  referenceNumber: string;
  contractingAuthority: string;
  deadline: string;
  source: string;
  sourceUrl: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('source');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [details, setDetails] = useState<TenderDetails>({
    title: '',
    referenceNumber: '',
    contractingAuthority: '',
    deadline: '',
    source: '',
    sourceUrl: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [createdTenderId, setCreatedTenderId] = useState<string | null>(null);

  function handleSourceSelect(source: string) {
    setSelectedSource(source);
    setDetails((d) => ({ ...d, source: source === 'manual' ? 'UPLOAD' : source === 'tenderned' ? 'TENDERNED' : 'MERCELL' }));
    setStep('details');
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError('Upload minimaal één document');
      return;
    }
    setUploading(true);
    setError('');
    setStep('processing');
    setUploadProgress(10);

    try {
      // Create tender first
      const tenderRes = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: details.title || 'Nieuwe Tender',
          referenceNumber: details.referenceNumber || undefined,
          contractingAuth: details.contractingAuthority || undefined,
          deadline: details.deadline || undefined,
          source: details.source || 'UPLOAD',
          sourceUrl: details.sourceUrl || undefined,
        }),
      });

      if (!tenderRes.ok) {
        const data = await tenderRes.json();
        throw new Error(data.error || 'Tender aanmaken mislukt');
      }

      const tender = await tenderRes.json();
      setCreatedTenderId(tender.id);
      setUploadProgress(30);

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('tenderId', tender.id);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || `Upload mislukt: ${files[i].name}`);
        }

        setUploadProgress(30 + Math.round(((i + 1) / files.length) * 60));
      }

      setUploadProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload mislukt');
      setStep('upload');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Tender Importeren</h1>
        <p className="text-muted-foreground mt-1">
          Importeer een aanbesteding van TenderNed, Mercell, of upload documenten
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {(['source', 'details', 'upload', 'processing'] as const).map((s, i) => {
          const labels = ['Bron', 'Details', 'Documenten', 'Verwerking'];
          const currentIdx = ['source', 'details', 'upload', 'processing'].indexOf(step);
          const isComplete = i < currentIdx;
          const isCurrent = s === step;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  isComplete
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${isCurrent ? 'font-medium' : 'text-muted-foreground'} hidden sm:inline`}>
                {labels[i]}
              </span>
              {i < 3 && <div className="h-px bg-border flex-1" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Source Selection */}
      {step === 'source' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleSourceSelect('tenderned')}
          >
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-base">TenderNed</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Plak de tender-URL en upload de bijbehorende documenten
              </p>
              <Badge variant="outline">Officieel platform</Badge>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleSourceSelect('mercell')}
          >
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-base">Mercell</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Plak de tender-URL en upload de bijbehorende documenten
              </p>
              <Badge variant="outline">EU Platform</Badge>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleSourceSelect('manual')}
          >
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-base">Handmatig</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Upload aanbestedingsdocumenten direct vanaf uw computer
              </p>
              <Badge variant="outline">Alle formaten</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tender Details</CardTitle>
            <CardDescription>
              {selectedSource === 'tenderned' || selectedSource === 'mercell'
                ? 'Plak de URL van de aanbesteding en vul de basisgegevens in'
                : 'Vul de basisgegevens van de aanbesteding in'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(selectedSource === 'tenderned' || selectedSource === 'mercell') && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {selectedSource === 'tenderned' ? 'TenderNed' : 'Mercell'} URL
                </label>
                <Input
                  placeholder={
                    selectedSource === 'tenderned'
                      ? 'https://www.tenderned.nl/aankondigingen/...'
                      : 'https://www.mercell.com/nl/...'
                  }
                  value={details.sourceUrl}
                  onChange={(e) => setDetails({ ...details, sourceUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Plak de volledige URL van de aanbesteding. Download vervolgens alle documenten en upload ze in de volgende stap.
                </p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titel aanbesteding *</label>
                <Input
                  placeholder="Naam van de aanbesteding"
                  value={details.title}
                  onChange={(e) => setDetails({ ...details, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Referentienummer</label>
                <Input
                  placeholder="bijv. 2024-AB-12345"
                  value={details.referenceNumber}
                  onChange={(e) => setDetails({ ...details, referenceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Aanbestedende dienst</label>
                <Input
                  placeholder="Naam opdrachtgever"
                  value={details.contractingAuthority}
                  onChange={(e) => setDetails({ ...details, contractingAuthority: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="datetime-local"
                  value={details.deadline}
                  onChange={(e) => setDetails({ ...details, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('source')}>
                Terug
              </Button>
              <Button onClick={() => setStep('upload')} disabled={!details.title}>
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Documents */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documenten Uploaden</CardTitle>
            <CardDescription>
              Upload alle aanbestedingsdocumenten: leidraad, PvE, bijlagen, nota van inlichtingen, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Klik om bestanden te selecteren
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, ZIP, TXT — max 50MB per bestand
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.docx,.zip,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{files.length} bestand(en) geselecteerd</p>
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      Verwijder
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tip: upload alle documenten</p>
              <p>Hoe meer documenten u uploadt, hoe beter TenderMe de aanbesteding kan analyseren. Denk aan:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Aanbestedingsleidraad / Beschrijvend document</li>
                <li>Programma van Eisen (PvE)</li>
                <li>Nota van Inlichtingen</li>
                <li>Conceptovereenkomst</li>
                <li>Bijlagen en formulieren</li>
                <li>Beoordelingskader / gunningscriteria</li>
              </ul>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('details')}>
                Terug
              </Button>
              <Button onClick={handleUpload} disabled={files.length === 0}>
                <Upload className="mr-2 h-4 w-4" />
                Uploaden & Verwerken
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Processing */}
      {step === 'processing' && (
        <Card>
          <CardHeader className="text-center">
            {uploadProgress < 100 ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
                <CardTitle>Documenten verwerken...</CardTitle>
                <CardDescription>
                  TenderMe analyseert uw documenten en extraheert de inhoud
                </CardDescription>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
                <CardTitle>Import Voltooid!</CardTitle>
                <CardDescription>
                  Alle documenten zijn succesvol verwerkt. U kunt nu de tender analyseren.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress}% verwerkt
            </p>
            {uploadProgress === 100 && createdTenderId && (
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => router.push('/tenders')}>
                  Naar overzicht
                </Button>
                <Button onClick={() => router.push(`/tenders/${createdTenderId}`)}>
                  Tender openen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
