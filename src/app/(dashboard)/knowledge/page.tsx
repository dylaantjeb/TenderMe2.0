'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Tag,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale/nl';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Category =
  | 'COMPANY_PROFILE'
  | 'CERTIFICATION'
  | 'REFERENCE_CASE'
  | 'KPI_ACHIEVEMENT'
  | 'METHODOLOGY'
  | 'STAFFING'
  | 'SECURITY_COMPLIANCE'
  | 'GOVERNANCE'
  | 'SUSTAINABILITY'
  | 'OTHER';

const CATEGORY_LABELS: Record<Category, string> = {
  COMPANY_PROFILE: 'Bedrijfsprofiel',
  CERTIFICATION: 'Certificering',
  REFERENCE_CASE: 'Referentie',
  KPI_ACHIEVEMENT: 'KPI Resultaat',
  METHODOLOGY: 'Methodologie',
  STAFFING: 'Personeel',
  SECURITY_COMPLIANCE: 'Beveiliging',
  GOVERNANCE: 'Governance',
  SUSTAINABILITY: 'Duurzaamheid',
  OTHER: 'Overig',
};

const CATEGORY_VARIANTS: Record<Category, 'default' | 'secondary' | 'info' | 'success' | 'warning'> = {
  COMPANY_PROFILE: 'default',
  CERTIFICATION: 'success',
  REFERENCE_CASE: 'info',
  KPI_ACHIEVEMENT: 'warning',
  METHODOLOGY: 'secondary',
  STAFFING: 'info',
  SECURITY_COMPLIANCE: 'warning',
  GOVERNANCE: 'secondary',
  SUSTAINABILITY: 'success',
  OTHER: 'secondary',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

interface EvidenceItem {
  id: string;
  title: string;
  category: Category;
  content: string;
  tags: string[];
  usageCount: number;
  updatedAt: string;
}

interface EvidenceFormData {
  title: string;
  category: Category;
  content: string;
  tags: string;
}

const EMPTY_FORM: EvidenceFormData = {
  title: '',
  category: 'OTHER',
  content: '',
  tags: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KnowledgePage() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Inline add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<EvidenceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EvidenceFormData>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---------- Fetch ----------

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory) params.set('category', activeCategory);
      const res = await fetch(`/api/knowledge?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ---------- Create ----------

  const handleCreate = async () => {
    if (!addForm.title.trim() || !addForm.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title.trim(),
          category: addForm.category,
          content: addForm.content.trim(),
          tags: addForm.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setAddForm(EMPTY_FORM);
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to create evidence:', error);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Update ----------

  const startEdit = (item: EvidenceItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      category: item.category,
      content: item.content,
      tags: item.tags.join(', '),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm.title.trim() || !editForm.content.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: editForm.title.trim(),
          category: editForm.category,
          content: editForm.content.trim(),
          tags: editForm.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        cancelEdit();
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to update evidence:', error);
    } finally {
      setEditSaving(false);
    }
  };

  // ---------- Delete ----------

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete evidence:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- Render helpers ----------

  const renderForm = (
    form: EvidenceFormData,
    setForm: (f: EvidenceFormData) => void,
    onSubmit: () => void,
    onCancel: () => void,
    isSaving: boolean,
    submitLabel: string,
  ) => (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titel</label>
            <Input
              placeholder="Titel van het bewijs"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as Category })
              }
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Inhoud</label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Beschrijf het bewijs, de referentie of het certificaat..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Tags <span className="text-muted-foreground font-normal">(komma-gescheiden)</span>
          </label>
          <Input
            placeholder="bijv. ISO 27001, cloud, security"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={onSubmit} disabled={isSaving || !form.title.trim() || !form.content.trim()}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {submitLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ---------- Page ----------

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kennisbank</h1>
          <p className="text-muted-foreground mt-1">
            Bewijs en referenties voor tenderantwoorden
          </p>
        </div>
        <Button onClick={() => { setShowAddForm(true); setEditingId(null); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuw bewijs toevoegen
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          Alle
        </Button>
        {ALL_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op titel, inhoud of tags..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6">
          {renderForm(
            addForm,
            setAddForm,
            handleCreate,
            () => { setShowAddForm(false); setAddForm(EMPTY_FORM); },
            saving,
            'Opslaan',
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Geen bewijsstukken gevonden</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Voeg bewijsstukken, certificeringen en referenties toe om uw tenderantwoorden te versterken.
          </p>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuw bewijs toevoegen
            </Button>
          )}
        </div>
      )}

      {/* Items list */}
      {!loading && items.length > 0 && (
        <div className="grid gap-4">
          {items.map((item) => {
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div key={item.id}>
                  {renderForm(
                    editForm,
                    setEditForm,
                    handleUpdate,
                    cancelEdit,
                    editSaving,
                    'Bijwerken',
                  )}
                </div>
              );
            }

            return (
              <Card key={item.id} className="group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {item.title}
                        </h3>
                        <Badge variant={CATEGORY_VARIANTS[item.category]}>
                          {CATEGORY_LABELS[item.category]}
                        </Badge>
                      </div>

                      {/* Content preview */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {item.content.length > 200
                          ? `${item.content.slice(0, 200)}...`
                          : item.content}
                      </p>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {item.usageCount}x gebruikt
                        </span>
                        <span>
                          Bijgewerkt {format(new Date(item.updatedAt), 'd MMM yyyy', { locale: nl })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(item)}
                        title="Bewerken"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Verwijderen"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
