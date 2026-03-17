'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewTenderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    referenceNumber: '',
    contractingAuth: '',
    deadline: '',
    description: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          referenceNumber: form.referenceNumber || undefined,
          contractingAuth: form.contractingAuth || undefined,
          deadline: form.deadline || undefined,
          description: form.description || undefined,
          source: 'MANUAL',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Aanmaken mislukt');
        return;
      }

      router.push(`/tenders/${data.data.id}`);
    } catch {
      setError('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/tenders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nieuwe Tender</h1>
        <p className="text-muted-foreground mt-1">Maak een nieuwe tender aan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tender Details</CardTitle>
          <CardDescription>
            Vul de basisgegevens in. U kunt later documenten uploaden en criteria toevoegen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Titel *</label>
              <Input
                placeholder="Naam van de aanbesteding"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Referentienummer</label>
                <Input
                  placeholder="bijv. 2024-AB-12345"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Aanbestedende dienst</label>
                <Input
                  placeholder="Naam opdrachtgever"
                  value={form.contractingAuth}
                  onChange={(e) => setForm({ ...form, contractingAuth: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Omschrijving</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Korte omschrijving van de aanbesteding..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || !form.title}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tender aanmaken
              </Button>
              <Link href="/tenders">
                <Button type="button" variant="outline">
                  Annuleren
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
