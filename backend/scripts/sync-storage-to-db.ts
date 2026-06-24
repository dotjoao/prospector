import 'dotenv/config';
import { readStorageJson, STORAGE_LEADS_PATH } from '../src/lib/supabase-storage.js';
import { getSupabase, leadToRow, isSupabaseConfigured } from '../src/lib/supabase.js';
import { Lead } from '../src/types/index.js';

async function main() {
  if (!isSupabaseConfigured()) process.exit(1);

  const storageLeads = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
  console.log(`Storage: ${storageLeads.length} leads`);

  const { count } = await getSupabase().from('leads').select('*', { count: 'exact', head: true });
  console.log(`DB antes: ${count} leads`);

  if (storageLeads.length === 0) return;

  const rows = storageLeads.map(leadToRow);
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await getSupabase().from('leads').upsert(batch, { onConflict: 'google_maps_url' });
    if (error) throw error;
  }

  const { count: after } = await getSupabase().from('leads').select('*', { count: 'exact', head: true });
  console.log(`DB depois: ${after} leads`);
}

main().catch(console.error);
