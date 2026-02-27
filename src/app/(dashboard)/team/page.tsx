'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Eigenaar',
  ADMIN: 'Beheerder',
  EDITOR: 'Redacteur',
  VIEWER: 'Lezer',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER: 'Volledige toegang inclusief facturering en gebruikersbeheer',
  ADMIN: 'Volledige toegang behalve facturering',
  EDITOR: 'Kan tenders aanmaken, bewerken en genereren',
  VIEWER: 'Kan tenders bekijken en exporteren',
};

export default function TeamPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">
            Beheer teamleden en toegangsrechten
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Uitnodigen
        </Button>
      </div>

      {/* Invite */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Teamlid uitnodigen
          </CardTitle>
          <CardDescription>
            Stuur een uitnodiging per email om samen te werken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="email@organisatie.nl" type="email" className="flex-1" />
            <select className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="EDITOR">Redacteur</option>
              <option value="VIEWER">Lezer</option>
              <option value="ADMIN">Beheerder</option>
            </select>
            <Button>Uitnodigen</Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles explanation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rollen & Rechten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border p-3">
                <Badge variant="outline" className="mt-0.5">
                  {label}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[key]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teamleden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Team management beschikbaar na registratie</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
