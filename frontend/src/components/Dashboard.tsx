import { useEffect, useState } from 'react';
import {
  Users,
  Star,
  Globe,
  MessageSquare,
  CheckCircle,
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

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;
  if (error) return <div className="text-destructive text-sm p-4 rounded-lg border border-destructive/30 bg-destructive/10">{error}</div>;
  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total de Leads"
        value={stats.totalLeads}
        icon={Users}
        iconClassName="bg-blue-500/20 text-blue-400"
      />
      <StatCard
        title="Alta Prioridade"
        value={stats.altaPrioridade}
        icon={Star}
        iconClassName="bg-orange-500/20 text-orange-400"
        description="Alta + Muito Alta"
      />
      <StatCard
        title="Sem Site"
        value={stats.semSite}
        icon={Globe}
        iconClassName="bg-red-500/20 text-red-400"
      />
      <StatCard
        title="Contatados"
        value={stats.contatados}
        icon={MessageSquare}
        iconClassName="bg-cyan-500/20 text-cyan-400"
      />
      <StatCard
        title="Fechados"
        value={stats.fechados}
        icon={CheckCircle}
        iconClassName="bg-emerald-500/20 text-emerald-400"
      />
    </div>
  );
}
