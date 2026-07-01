import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Users,
  FileSpreadsheet,
  Database,
  LogOut,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { SearchForm } from '@/components/SearchForm';
import { LeadFiltersPanel } from '@/components/LeadFiltersPanel';
import { LeadTable } from '@/components/LeadTable';
import { ExportPanel, useThemes } from '@/components/ExportPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadFilters, SearchParams } from '@/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

const TAB_HINTS: Record<string, string> = {
  prospectar: 'Busque novos leads e veja os melhores prospects',
  leads: 'Gerencie, filtre e contate seus leads',
  exportar: 'Baixe planilhas Excel por categoria',
};

export function HomePage() {
  const { user, signOut } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [topProspects, setTopProspects] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'warming' | 'searching'>('warming');
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState('prospectar');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [defaultCity, setDefaultCity] = useState('Cuiabá');
  const [defaultState, setDefaultState] = useState('MT');
  const [dashboardKey, setDashboardKey] = useState(0);
  const [storage, setStorage] = useState<'supabase' | 'json'>('json');
  const [persistenceMode, setPersistenceMode] = useState<string>('json');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { themes, loading: themesLoading } = useThemes(dashboardKey);
  const fetchGenerationRef = useRef(0);
  const skipLoadEffectRef = useRef(false);

  const loadLeads = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const data = await api.getLeads({ ...filters, page, limit: PAGE_SIZE });
      if (generation !== fetchGenerationRef.current) return;
      setLeads(data.leads);
      setTotalLeads(data.total);
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        showNotification('error', (err as Error).message);
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [filters, page]);

  useEffect(() => {
    api.warmup().catch(() => {});
    api.getConfig().then((config) => {
      setDefaultCity(config.defaultCity);
      setDefaultState(config.defaultState);
    }).catch(() => {});
    api.getHealth().then((h) => {
      setStorage(h.storage);
      setPersistenceMode((h as { persistenceMode?: string }).persistenceMode || h.storage);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (skipLoadEffectRef.current) return;
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (!searching) {
      setSearchElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setSearchElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [searching]);

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  async function handleSearch(params: SearchParams) {
    fetchGenerationRef.current++;
    skipLoadEffectRef.current = true;
    setSearching(true);
    setSearchPhase('warming');
    setTopProspects([]);
    setLeads([]);
    setTotalLeads(0);

    try {
      await api.warmup();
      setSearchPhase('searching');
      const result = await api.findOpportunities(params);
      setTopProspects(result.topProspects);

      const newFilters: LeadFilters = {
        categoria: params.categoria,
        cidade: params.cidade,
      };
      setFilters(newFilters);
      setPage(1);

      const generation = ++fetchGenerationRef.current;
      const data = await api.getLeads({ ...newFilters, page: 1, limit: PAGE_SIZE });
      if (generation !== fetchGenerationRef.current) return;
      setLeads(data.leads);
      setTotalLeads(data.total);

      showNotification(result.warning ? 'error' : 'success', result.message);
      setDashboardKey((k) => k + 1);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setSearching(false);
      skipLoadEffectRef.current = false;
    }
  }

  function handleRefresh() {
    loadLeads();
    setDashboardKey((k) => k + 1);
  }

  async function handleClearAllLeads() {
    setClearing(true);
    try {
      const result = await api.clearAllLeads();
      setFilters({});
      setPage(1);
      setTopProspects([]);
      setLeads([]);
      setTotalLeads(0);
      setClearDialogOpen(false);
      setDashboardKey((k) => k + 1);
      showNotification('success', `${result.count} leads removidos com sucesso.`);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setClearing(false);
    }
  }

  const leadsTitle = filters.categoria
    ? filters.categoria
    : 'Todos os leads';

  const storageLabel = storage === 'supabase'
    ? persistenceMode === 'supabase-db' ? 'Supabase' : 'Supabase'
    : 'JSON local';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 p-2 ring-1 ring-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">LeadHunter</h1>
                <Badge variant="outline" className="text-[10px] gap-1 hidden sm:flex border-white/10">
                  <Database className="h-3 w-3" />
                  {storageLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Olá, {user?.username || 'usuário'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Atualizar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Limpar</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {notification && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div
            className={cn(
              'flex items-center gap-2 p-3 rounded-xl text-sm border',
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-destructive/10 text-destructive border-destructive/25'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-secondary/50 border border-white/[0.06]">
            <TabsTrigger value="prospectar" className="gap-2 py-2.5 data-[state=active]:shadow-md">
              <Search className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Prospectar</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2 py-2.5 data-[state=active]:shadow-md">
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Leads</span>
              {totalLeads > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                  {totalLeads}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exportar" className="gap-2 py-2.5 data-[state=active]:shadow-md">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Exportar</span>
            </TabsTrigger>
          </TabsList>

          <p className="text-xs text-muted-foreground mt-3 mb-6 pl-1">
            {TAB_HINTS[activeTab]}
          </p>

          <TabsContent value="prospectar" className="space-y-8 mt-0">
            <div key={dashboardKey}>
              <Dashboard />
            </div>
            <SearchForm
              onSearch={handleSearch}
              defaultCity={defaultCity}
              defaultState={defaultState}
            />
            {searching && (
              <div className="glass-card py-12 text-center space-y-4">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {searchPhase === 'warming'
                      ? 'Conectando ao servidor...'
                      : 'Buscando empresas e analisando sites...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchPhase === 'warming'
                      ? 'O servidor pode levar até 1 minuto para acordar (Render free)'
                      : 'Isso pode levar de 1 a 3 minutos dependendo da quantidade de resultados'}
                  </p>
                  {searchElapsed > 0 && (
                    <p className="text-xs text-muted-foreground/70 tabular-nums">
                      {searchElapsed}s decorridos
                    </p>
                  )}
                </div>
              </div>
            )}
            {topProspects.length > 0 && !searching && (
              <LeadTable
                leads={topProspects}
                title="Melhores prospects"
                highlightTop={20}
                onRefresh={handleRefresh}
              />
            )}
          </TabsContent>

          <TabsContent value="leads" className="space-y-5 mt-0">
            <LeadFiltersPanel
              filters={filters}
              themes={themes}
              onChange={setFilters}
            />
            <LeadTable
              leads={leads}
              total={totalLeads}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              loading={loading}
              title={leadsTitle}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="exportar" className="mt-0">
            <ExportPanel
              themes={themes}
              loading={themesLoading}
              onNotify={showNotification}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-white/[0.04] mt-12 py-6 text-center text-xs text-muted-foreground">
        LeadHunter · {storageLabel} · Excel exportável
      </footer>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar todos os leads?</DialogTitle>
            <DialogDescription>
              Remove permanentemente {totalLeads > 0 ? `${totalLeads} ` : ''}leads do banco.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)} disabled={clearing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearAllLeads} disabled={clearing}>
              {clearing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Limpando...
                </>
              ) : (
                'Sim, limpar tudo'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
