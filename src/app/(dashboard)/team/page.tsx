'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Shield, Mail, Loader2, Trash2 } from 'lucide-react';

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

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'info'> = {
  OWNER: 'default',
  ADMIN: 'info',
  EDITOR: 'secondary',
  VIEWER: 'outline',
};

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadMembers() {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Uitnodiging mislukt');
      } else {
        setSuccess(`${inviteEmail} is toegevoegd als ${ROLE_LABELS[inviteRole]}`);
        setInviteEmail('');
        loadMembers();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch {
      setError('Uitnodiging mislukt');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Weet u zeker dat u dit teamlid wilt verwijderen?')) return;
    setRemoving(userId);
    setError('');

    try {
      const res = await fetch(`/api/team?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verwijdering mislukt');
      } else {
        loadMembers();
      }
    } catch {
      setError('Verwijdering mislukt');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">
            Beheer teamleden en toegangsrechten
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-400 mb-6">
          {success}
        </div>
      )}

      {/* Invite */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Teamlid uitnodigen
          </CardTitle>
          <CardDescription>
            Voeg een nieuw teamlid toe aan uw organisatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="email@organisatie.nl"
              type="email"
              className="flex-1"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="EDITOR">Redacteur</option>
              <option value="VIEWER">Lezer</option>
              <option value="ADMIN">Beheerder</option>
            </select>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Uitnodigen
                </>
              )}
            </Button>
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
                <Badge variant={ROLE_BADGE_VARIANT[key] || 'outline'} className="mt-0.5">
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
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nog geen teamleden gevonden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {(member.name || member.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.name || member.email}
                      </p>
                      {member.name && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ROLE_BADGE_VARIANT[member.role] || 'outline'}>
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                    {member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id)}
                        disabled={removing === member.id}
                      >
                        {removing === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
