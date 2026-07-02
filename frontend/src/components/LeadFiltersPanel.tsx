import { useState } from 'react';
import { Filter, X, Tag, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORIDADES } from '@/services/api';
import { LeadFilters, LeadStatus } from '@/types';
import { ThemeOption } from '@/components/ExportPanel';
import { cn } from '@/lib/utils';

interface LeadFiltersPanelProps {
  filters: LeadFilters;
  themes: ThemeOption[];
  onChange: (filters: LeadFilters) => void;
}

const CRM_STATUS_FILTERS: {
  value?: LeadStatus;
  label: string;
  activeClass?: string;
}[] = [
  { label: 'Todos' },
  { value: 'Nao Contatado', label: 'Não contatado' },
  {
    value: 'Mensagem Enviada',
    label: 'Mensagem enviada',
    activeClass: 'bg-cyan-500 hover:bg-cyan-500/90 text-white border-cyan-500/50',
  },
  { value: 'Interessado', label: 'Interessado', activeClass: 'bg-blue-500 hover:bg-blue-500/90 text-white border-blue-500/50' },
  { value: 'Proposta Enviada', label: 'Proposta enviada', activeClass: 'bg-purple-500 hover:bg-purple-500/90 text-white border-purple-500/50' },
  { value: 'Fechado', label: 'Fechado', activeClass: 'bg-emerald-500 hover:bg-emerald-500/90 text-white border-emerald-500/50' },
  { value: 'Perdido', label: 'Perdido', activeClass: 'bg-red-500 hover:bg-red-500/90 text-white border-red-500/50' },
];

export function LeadFiltersPanel({ filters, themes, onChange }: LeadFiltersPanelProps) {
  const [expanded, setExpanded] = useState(true);

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

  function selectStatus(status?: LeadStatus) {
    if (!status) {
      const { status: _, ...rest } = filters;
      onChange(rest);
    } else {
      onChange({ ...filters, status });
    }
  }

  function clearFilters() {
    onChange({});
  }

  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;
  const activeTheme = filters.categoria || null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-sm">Filtros</h3>
            {activeCount > 0 && (
              <p className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</p>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          )}
        </button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 text-xs">
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {themes.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Categoria
              </Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!activeTheme ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer px-3 py-1 transition-colors',
                    !activeTheme && 'bg-primary hover:bg-primary/90'
                  )}
                  onClick={() => selectTheme('all')}
                >
                  Todos ({themes.reduce((s, t) => s + t.count, 0)})
                </Badge>
                {themes.map((theme) => (
                  <Badge
                    key={theme.name}
                    variant={activeTheme === theme.name ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer px-3 py-1 transition-colors',
                      activeTheme === theme.name && 'bg-primary hover:bg-primary/90'
                    )}
                    onClick={() => selectTheme(theme.name)}
                  >
                    {theme.name} ({theme.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              Status CRM
            </Label>
            <div className="flex flex-wrap gap-2">
              {CRM_STATUS_FILTERS.map((item) => {
                const isActive = item.value ? filters.status === item.value : !filters.status;

                return (
                  <Badge
                    key={item.label}
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer px-3 py-1 transition-colors',
                      isActive && (item.activeClass || 'bg-primary hover:bg-primary/90')
                    )}
                    onClick={() => selectStatus(item.value)}
                  >
                    {item.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Buscar empresa</Label>
              <Input
                placeholder="Nome..."
                value={filters.busca || ''}
                onChange={(e) => updateFilter('busca', e.target.value || undefined)}
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={filters.cidade || ''}
                onChange={(e) => updateFilter('cidade', e.target.value || undefined)}
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Score mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.scoreMinimo ?? ''}
                onChange={(e) =>
                  updateFilter('scoreMinimo', e.target.value ? Number(e.target.value) : undefined)
                }
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select
                value={filters.prioridade || 'all'}
                onValueChange={(v) => updateFilter('prioridade', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="bg-background/50 h-9">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Site</Label>
              <Select
                value={filters.possuiSite === undefined ? 'all' : filters.possuiSite ? 'yes' : 'no'}
                onValueChange={(v) =>
                  updateFilter('possuiSite', v === 'all' ? undefined : v === 'yes')
                }
              >
                <SelectTrigger className="bg-background/50 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Com site</SelectItem>
                  <SelectItem value="no">Sem site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
