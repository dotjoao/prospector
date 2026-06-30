import { useEffect, useState } from 'react';
import {
  Users,
  Globe,
  MessageSquare,
  CheckCircle,
  Flame,
  Thermometer,
  Snowflake,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/services/api';
import { DashboardStats } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Carregando métricas..." />;
  if (error) {
    return (
      <div className="text-destructive text-sm p-4 rounded-xl border border-destructive/30 bg-destructive/10">
        {error}
      </div>
    );
  }
  if (!stats) return null;

  const quentes = stats.leadsQuentes ?? 0;
  const mornos = stats.leadsMornos ?? 0;
  const frios = stats.leadsFrios ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="section-label">Prioridade estratégica</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Leads quentes"
          value={quentes}
          icon={Flame}
          accent="hot"
          description="Score 160+ · abordagem direta"
        />
        <StatCard
          title="Leads mornos"
          value={mornos}
          icon={Thermometer}
          accent="warm"
          description="Score 120–159 · nutrição"
        />
        <StatCard
          title="Leads frios"
          value={frios}
          icon={Snowflake}
          accent="cold"
          description="Score &lt; 120 · autoridade"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="section-label">Visão geral</h2>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.totalLeads}
          icon={Users}
          accent="blue"
          compact
        />
        <StatCard
          title="Sem site"
          value={stats.semSite}
          icon={Globe}
          accent="default"
          compact
        />
        <StatCard
          title="Contatados"
          value={stats.contatados}
          icon={MessageSquare}
          accent="cyan"
          compact
        />
        <StatCard
          title="Fechados"
          value={stats.fechados}
          icon={CheckCircle}
          accent="emerald"
          compact
        />
      </div>
    </div>
  );
}
