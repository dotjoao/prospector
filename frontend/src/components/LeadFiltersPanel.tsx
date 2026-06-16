import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LEAD_STATUSES, PRIORIDADES } from '@/services/api';
import { LeadFilters } from '@/types';

interface LeadFiltersPanelProps {
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
}

export function LeadFiltersPanel({ filters, onChange }: LeadFiltersPanelProps) {
  const [expanded, setExpanded] = useState(false);

  function updateFilter(key: keyof LeadFilters, value: string | number | boolean | undefined) {
    onChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onChange({});
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <div className="flex gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Buscar por nome</Label>
          <Input
            placeholder="Nome da empresa..."
            value={filters.busca || ''}
            onChange={(e) => updateFilter('busca', e.target.value || undefined)}
          />
        </div>

        {expanded && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mt-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Cidade"
                value={filters.cidade || ''}
                onChange={(e) => updateFilter('cidade', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                placeholder="Categoria"
                value={filters.categoria || ''}
                onChange={(e) => updateFilter('categoria', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Possui Site</Label>
              <Select
                value={filters.possuiSite === undefined ? 'all' : filters.possuiSite ? 'yes' : 'no'}
                onValueChange={(v) =>
                  updateFilter('possuiSite', v === 'all' ? undefined : v === 'yes')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Com Site</SelectItem>
                  <SelectItem value="no">Sem Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score Mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.scoreMinimo ?? ''}
                onChange={(e) =>
                  updateFilter('scoreMinimo', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={filters.prioridade || 'all'}
                onValueChange={(v) => updateFilter('prioridade', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => updateFilter('status', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
