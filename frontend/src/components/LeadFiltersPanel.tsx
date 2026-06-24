import { Filter, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ThemeOption } from '@/components/ExportPanel';

interface LeadFiltersPanelProps {
  filters: LeadFilters;
  themes: ThemeOption[];
  onChange: (filters: LeadFilters) => void;
}

export function LeadFiltersPanel({ filters, themes, onChange }: LeadFiltersPanelProps) {
  function updateFilter(key: keyof LeadFilters, value: string | number | boolean | undefined) {
    onChange({ ...filters, [key]: value });
  }

  function selectTheme(theme: string) {
    if (theme === 'all') {
      const { categoria, ...rest } = filters;
      onChange(rest);
    } else {
      onChange({ ...filters, categoria: theme });
    }
  }

  function clearFilters() {
    onChange({});
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');
  const activeTheme = filters.categoria || null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrar leads
          </CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {themes.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              Tema / Categoria
            </Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!activeTheme ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1"
                onClick={() => selectTheme('all')}
              >
                Todos ({themes.reduce((s, t) => s + t.count, 0)})
              </Badge>
              {themes.map((theme) => (
                <Badge
                  key={theme.name}
                  variant={activeTheme === theme.name ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => selectTheme(theme.name)}
                >
                  {theme.name} ({theme.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Buscar por nome</Label>
            <Input
              placeholder="Nome da empresa..."
              value={filters.busca || ''}
              onChange={(e) => updateFilter('busca', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Cidade"
              value={filters.cidade || ''}
              onChange={(e) => updateFilter('cidade', e.target.value || undefined)}
            />
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
            <Label>Possui site</Label>
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
                <SelectItem value="yes">Com site</SelectItem>
                <SelectItem value="no">Sem site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Score mínimo</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.scoreMinimo ?? ''}
              onChange={(e) =>
                updateFilter('scoreMinimo', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
