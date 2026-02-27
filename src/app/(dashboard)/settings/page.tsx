'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  CreditCard,
  Bell,
  Key,
  Building,
  Users,
  Globe,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer uw account en organisatie</p>
      </div>

      <div className="space-y-6">
        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organisatie
            </CardTitle>
            <CardDescription>Organisatie-instellingen en informatie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organisatienaam</label>
                <Input placeholder="Uw organisatie" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sector</label>
                <Input placeholder="bijv. ICT, Bouw, Consultancy" />
              </div>
            </div>
            <Button>Opslaan</Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
            <CardDescription>Uw huidige plan en facturering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">Free Plan</span>
                  <Badge variant="secondary">Huidig</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  2 tenders per maand, 1 gebruiker
                </p>
              </div>
              <Button>Upgraden</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Beveiliging & Privacy
            </CardTitle>
            <CardDescription>GDPR compliance en data management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <span className="text-sm font-medium">GDPR Data Export</span>
                <p className="text-xs text-muted-foreground">
                  Download al uw gegevens conform AVG/GDPR
                </p>
              </div>
              <Button variant="outline" size="sm">
                Exporteren
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <span className="text-sm font-medium">Data Retentie</span>
                <p className="text-xs text-muted-foreground">
                  Tenders worden 24 maanden bewaard na archivering
                </p>
              </div>
              <Badge variant="info">24 maanden</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
              <div>
                <span className="text-sm font-medium text-destructive">Account Verwijderen</span>
                <p className="text-xs text-muted-foreground">
                  Verwijder permanent al uw gegevens
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Verwijderen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Sleutels
            </CardTitle>
            <CardDescription>Beheer API-toegang voor integraties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">API-toegang is beschikbaar op het Enterprise plan</p>
              <Button variant="outline" size="sm" className="mt-3">
                Upgrade naar Enterprise
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Disclaimer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              AI Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Juridische disclaimer:</strong> TenderMe maakt gebruik van kunstmatige
                intelligentie (AI) voor het analyseren van aanbestedingsdocumenten en het
                genereren van concept-antwoorden.
              </p>
              <p>
                AI-gegenereerde content dient uitsluitend als concept en professioneel
                uitgangspunt. De gebruiker is volledig verantwoordelijk voor het controleren,
                aanpassen en indienen van aanbestedingsantwoorden.
              </p>
              <p>
                TenderMe garandeert geen specifieke scores, resultaten of gunningen. Het
                gebruik van TenderMe ontslaat de gebruiker niet van hun professionele
                verantwoordelijkheid bij het inschrijven op aanbestedingen.
              </p>
              <p>
                Alle data wordt verwerkt conform de AVG/GDPR en wordt opgeslagen binnen de
                Europese Economische Ruimte (EER).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
