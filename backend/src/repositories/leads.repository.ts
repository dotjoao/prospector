import { getSupabase, leadToRow, rowToLead, LeadRow } from '../lib/supabase.js';
import { Lead, LeadFilters, UpdateLeadPayload, DashboardStats, PaginatedLeads } from '../types/index.js';

const LIST_COLUMNS =
  'id,empresa,categoria,endereco,cidade,estado,telefone,website,nota,avaliacoes,google_maps_url,data_coleta,score,prioridade,status,ultimo_contato,proximo_follow_up,observacoes,mensagem_prospeccao,created_at,updated_at';

const CONTACTED_STATUSES = [
  'Mensagem Enviada',
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

export class SupabaseLeadsRepository {
  private table = 'leads';

  async getAll(): Promise<Lead[]> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select('*')
      .order('score', { ascending: false });

    if (error) throw new Error(`[Supabase] Erro ao listar leads: ${error.message}`);
    return (data as LeadRow[]).map(rowToLead);
  }

  async filterPaginated(filters: LeadFilters): Promise<PaginatedLeads> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 50), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = getSupabase()
      .from(this.table)
      .select(LIST_COLUMNS, { count: 'exact' });

    if (filters.busca) query = query.ilike('empresa', `%${filters.busca}%`);
    if (filters.cidade) query = query.ilike('cidade', `%${filters.cidade}%`);
    if (filters.categoria) query = query.ilike('categoria', `%${filters.categoria}%`);
    if (filters.possuiSite === true) query = query.neq('website', '');
    if (filters.possuiSite === false) query = query.or('website.is.null,website.eq.');
    if (filters.scoreMinimo !== undefined) query = query.gte('score', filters.scoreMinimo);
    if (filters.prioridade) query = query.eq('prioridade', filters.prioridade);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query
      .order('score', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`[Supabase] Erro ao filtrar leads: ${error.message}`);

    return {
      leads: (data as LeadRow[]).map(rowToLead),
      total: count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<Lead | undefined> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[Supabase] Erro ao buscar lead: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : undefined;
  }

  async upsertMany(leads: Lead[]): Promise<number> {
    if (leads.length === 0) return 0;

    const rows = leads.map(leadToRow);
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { data, error } = await getSupabase()
        .from(this.table)
        .upsert(batch, { onConflict: 'google_maps_url', ignoreDuplicates: true })
        .select('id');

      if (error) throw new Error(`[Supabase] Erro ao inserir leads: ${error.message}`);
      inserted += data?.length ?? 0;
    }

    return inserted;
  }

  async update(id: string, updates: UpdateLeadPayload): Promise<Lead | null> {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.ultimoContato !== undefined) payload.ultimo_contato = updates.ultimoContato || null;
    if (updates.proximoFollowUp !== undefined) payload.proximo_follow_up = updates.proximoFollowUp || null;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;
    if (updates.mensagemProspeccao !== undefined) payload.mensagem_prospeccao = updates.mensagemProspeccao;

    const { data, error } = await getSupabase()
      .from(this.table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(`[Supabase] Erro ao atualizar lead: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await getSupabase()
      .from(this.table)
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(`[Supabase] Erro ao remover lead: ${error.message}`);
    return (count ?? 0) > 0;
  }

  async filter(filters: LeadFilters): Promise<Lead[]> {
    const result = await this.filterPaginated({ ...filters, page: 1, limit: 10000 });
    return result.leads;
  }

  async getByCategory(categoria: string): Promise<Lead[]> {
    const target = categoria.toLowerCase();
    const { data, error } = await getSupabase()
      .from(this.table)
      .select('*')
      .ilike('categoria', categoria)
      .order('score', { ascending: false });

    if (error) throw new Error(`[Supabase] Erro ao buscar por categoria: ${error.message}`);

    return (data as LeadRow[])
      .map(rowToLead)
      .filter((l) => l.categoria.toLowerCase() === target);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await getSupabase().rpc('leadhunter_dashboard_stats');
    if (!error && data) return data as DashboardStats;

    const sb = getSupabase();
    const [total, alta, semSite, contatados, fechados] = await Promise.all([
      sb.from(this.table).select('*', { count: 'exact', head: true }),
      sb.from(this.table).select('*', { count: 'exact', head: true }).in('prioridade', ['Alta', 'Muito Alta']),
      sb.from(this.table).select('*', { count: 'exact', head: true }).or('website.is.null,website.eq.'),
      sb.from(this.table).select('*', { count: 'exact', head: true }).in('status', CONTACTED_STATUSES),
      sb.from(this.table).select('*', { count: 'exact', head: true }).eq('status', 'Fechado'),
    ]);

    return {
      totalLeads: total.count ?? 0,
      altaPrioridade: alta.count ?? 0,
      semSite: semSite.count ?? 0,
      contatados: contatados.count ?? 0,
      fechados: fechados.count ?? 0,
    };
  }

  async getCategories(): Promise<{ name: string; count: number }[]> {
    const { data, error } = await getSupabase()
      .from('leads_category_counts')
      .select('name,count')
      .order('name');

    if (!error && data) {
      return data.map((row) => ({ name: row.name, count: Number(row.count) }));
    }

    const { data: rows, error: catError } = await getSupabase()
      .from(this.table)
      .select('categoria');

    if (catError) throw new Error(`[Supabase] Erro ao listar categorias: ${catError.message}`);

    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const name = row.categoria?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async countAll(): Promise<number> {
    const { count, error } = await getSupabase()
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(`[Supabase] Erro ao contar leads: ${error.message}`);
    return count ?? 0;
  }
}

export const supabaseLeadsRepository = new SupabaseLeadsRepository();
