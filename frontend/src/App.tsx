import { useCallback, useEffect, useState } from 'react';
import {
  Target,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { SearchForm } from '@/components/SearchForm';
import { LeadFiltersPanel } from '@/components/LeadFiltersPanel';
import { LeadTable } from '@/components/LeadTable';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Lead, LeadFilters, SearchParams } from '@/types';

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [topProspects, setTopProspects] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [defaultCity, setDefaultCity] = useState('Cuiabá');
  const [defaultState, setDefaultState] = useState('MT');
  const [dashboardKey, setDashboardKey] = useState(0);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLeads(filters);
      setLeads(data);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLeads();
    api.getConfig().then((config) => {
      setDefaultCity(config.defaultCity);
      setDefaultState(config.defaultState);
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
      showNotification('success', result.message);
      await loadLeads();
      setDashboardKey((k) => k + 1);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await api.exportExcel();
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = 'leads.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', `${result.count} leads exportados para Excel`);
    } catch (err) {
      showNotification('error', (err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  function handleRefresh() {
    loadLeads();
    setDashboardKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LeadHunter</h1>
              <p className="text-xs text-muted-foreground">Prospecção Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || leads.length === 0}>
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </div>
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

      <main className="container mx-auto px-4 py-6 space-y-6">
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

        <LeadFiltersPanel filters={filters} onChange={setFilters} />

        <LeadTable
          leads={leads}
          loading={loading}
          title="Todos os Leads"
          onRefresh={handleRefresh}
        />
      </main>

      <footer className="border-t mt-8 py-4 text-center text-xs text-muted-foreground">
        LeadHunter MVP — Persistência em arquivos JSON locais
      </footer>
    </div>
  );
}

export default App;
