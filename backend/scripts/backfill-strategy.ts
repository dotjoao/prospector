import 'dotenv/config';
import { readJsonFile, writeJsonFile } from '../src/utils/storage.js';
import { LEADS_FILE } from '../src/config/paths.js';
import { enrichLeadStrategy } from '../src/lib/strategy-engine.js';
import { leadToRow } from '../src/lib/supabase.js';
import { getSupabase, isSupabaseConfigured } from '../src/lib/supabase.js';
import { Lead } from '../src/types/index.js';

async function backfillJson(): Promise<number> {
  const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);
  const enriched = leads.map(enrichLeadStrategy);
  await writeJsonFile(LEADS_FILE, enriched);
  return enriched.length;
}

async function backfillSupabase(): Promise<number> {
  const { data, error } = await getSupabase().from('leads').select('*');
  if (error) throw error;
  if (!data?.length) return 0;

  const rows = (data as Record<string, unknown>[]).map((row) => {
    const lead = enrichLeadStrategy({
      id: String(row.id),
      empresa: String(row.empresa),
      categoria: String(row.categoria),
      endereco: String(row.endereco),
      cidade: String(row.cidade),
      estado: String(row.estado),
      telefone: String(row.telefone ?? ''),
      website: String(row.website ?? ''),
      nota: Number(row.nota ?? 0),
      avaliacoes: Number(row.avaliacoes ?? 0),
      googleMapsUrl: String(row.google_maps_url),
      dataColeta: String(row.data_coleta),
      score: Number(row.score ?? 0),
      prioridade: (row.prioridade as Lead['prioridade']) || 'Media',
      status: (row.status as Lead['status']) || 'Nao Contatado',
      websiteAnalysis: row.website_analysis as Lead['websiteAnalysis'],
      mensagemProspeccao: row.mensagem_prospeccao as string | undefined,
    });
    return leadToRow(lead);
  });

  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: upsertError } = await getSupabase()
      .from('leads')
      .upsert(batch, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  return rows.length;
}

const mode = process.argv[2] || (isSupabaseConfigured() ? 'supabase' : 'json');

try {
  const count = mode === 'supabase' ? await backfillSupabase() : await backfillJson();
  console.log(`[Backfill] ✓ ${count} leads atualizados (${mode})`);
} catch (err) {
  console.error('[Backfill] Erro:', (err as Error).message);
  process.exit(1);
}
