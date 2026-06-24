import { useCallback, useEffect, useState } from 'react';
import {
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Users,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { SearchForm } from '@/components/SearchForm';
import { LeadFiltersPanel } from '@/components/LeadFiltersPanel';
import { LeadTable } from '@/components/LeadTable';
import { ExportPanel, useThemes } from '@/components/ExportPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { Lead, LeadFilters, SearchParams } from '@/types';

const PAGE_SIZE = 50;

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [topProspects, setTopProspects] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [defaultCity, setDefaultCity] = useState('Cuiabá');
  const [defaultState, setDefaultState] = useState('MT');
  const [dashboardKey, setDashboardKey] = useState(0);
  const [storage, setStorage] = useState<'supabase' | 'json'>('json');
  const [persistenceMode, setPersistenceMode] = useState<string>('json');
  const { themes, loading: themesLoading } = useThemes(dashboardKey);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({ ...filters, page, limit: PAGE_SIZE });
      setLeads(data.leads);
      setTotalLeads(data.total);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    loadLeads();
    api.getConfig().then((config) => {
      setDefaultCity(config.defaultCity);
      setDefaultState(config.defaultState);
    }).catch(() => {});
    api.getHealth().then((h) => {
      setStorage(h.storage);
      setPersistenceMode((h as { persistenceMode?: string }).persistenceMode || h.storage);
    }).catch(() => {});
  }, [loadLeads]);

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  async function handleSearch(params: SearchParams) {
    setSearching(true);
    try {
      const result = await api.findOpportunities(params);
      setTopProspects(result.topProspects);

      const newFilters: LeadFilters = {
        categoria: params.categoria,
        cidade: params.cidade,
      };
      setFilters(newFilters);
      setPage(1);

      const data = await api.getLeads({ ...newFilters, page: 1, limit: PAGE_SIZE });
      setLeads(data.leads);
      setTotalLeads(data.total);

      showNotification(result.warning ? 'error' : 'success', result.message);
      setDashboardKey((k) => k + 1);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  function handleRefresh() {
    loadLeads();
    setDashboardKey((k) => k + 1);
  }

  const leadsTitle = filters.categoria
    ? `Leads — ${filters.categoria}`
    : 'Todos os leads';

  const storageLabel = storage === 'supabase'
    ? persistenceMode === 'supabase-db' ? 'Supabase DB' : 'Supabase'
    : 'JSON local';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">LeadHunter</h1>
                <Badge variant="outline" className="text-xs gap-1 hidden sm:flex">
                  <Database className="h-3 w-3" />
                  {storageLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Prospecção Inteligente</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </header>

      {notification && (
        <div className="container mx-auto px-4 pt-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-destructive/10 text-destructive border border-destructive/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="prospectar" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="prospectar" className="gap-2">
              <Search className="h-4 w-4 hidden sm:block" />
              Prospectar
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="exportar" className="gap-2">
              <FileSpreadsheet className="h-4 w-4 hidden sm:block" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prospectar" className="space-y-6">
            <div key={dashboardKey}>
              <Dashboard />
            </div>
            <SearchForm
              onSearch={handleSearch}
              defaultCity={defaultCity}
              defaultState={defaultState}
            />
            {searching && (
              <div className="text-center py-8 space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">
                  Buscando empresas, analisando sites e calculando scores...
                </p>
                <p className="text-xs text-muted-foreground">Isso pode levar alguns minutos</p>
              </div>
            )}
            {topProspects.length > 0 && !searching && (
              <LeadTable
                leads={topProspects}
                title="Top 20 Prospects"
                highlightTop={20}
                onRefresh={handleRefresh}
              />
            )}
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
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

          <TabsContent value="exportar">
            <ExportPanel
              themes={themes}
              loading={themesLoading}
              onNotify={showNotification}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-8 py-4 text-center text-xs text-muted-foreground">
        LeadHunter — Dados no {storageLabel} · Planilhas Excel exportáveis
      </footer>
    </div>
  );
}

export default App;
