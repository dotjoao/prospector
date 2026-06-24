import 'dotenv/config';
import { readJsonFile } from '../src/utils/storage.js';
import { LEADS_FILE, CONFIG_FILE } from '../src/config/paths.js';
import { Lead, AppConfig } from '../src/types/index.js';
import { isSupabaseConfigured, getSupabase, leadToRow } from '../src/lib/supabase.js';
import { supabaseConfigRepository } from '../src/repositories/config.repository.js';
import { initPersistence, getPersistenceMode } from '../src/lib/persistence.js';
import { storageLeadsRepository, storageConfigRepository } from '../src/repositories/storage-json.repository.js';

const DEFAULT_CONFIG: AppConfig = {
  googlePlacesApiKey: '',
  defaultCity: 'Cuiabá',
  defaultState: 'MT',
  maxResults: 60,
  topProspects: 20,
  enableScreenshots: false,
};

async function migrateLeadsDb(leads: Lead[]): Promise<void> {
  const rows = leads.map(leadToRow);
  const batchSize = 50;
  let migrated = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await getSupabase()
      .from('leads')
      .upsert(batch, { onConflict: 'google_maps_url' });

    if (error) throw new Error(`Erro ao migrar leads: ${error.message}`);
    migrated += batch.length;
    console.log(`Migrados ${migrated}/${rows.length} leads (PostgreSQL)...`);
  }

  console.log(`✓ ${migrated} leads migrados para Supabase PostgreSQL`);
}

async function migrateLeadsStorage(leads: Lead[]): Promise<void> {
  await storageLeadsRepository.saveAll(leads);
  console.log(`✓ ${leads.length} leads migrados para Supabase Storage`);
}

async function migrateConfigDb(config: AppConfig): Promise<void> {
  await supabaseConfigRepository.updateConfig(config);
  console.log('✓ Configurações migradas para Supabase PostgreSQL');
}

async function migrateConfigStorage(config: AppConfig): Promise<void> {
  await storageConfigRepository.updateConfig(config);
  console.log('✓ Configurações migradas para Supabase Storage');
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY em backend/.env');
    process.exit(1);
  }

  console.log('Iniciando migração JSON → Supabase...\n');

  await initPersistence();
  const mode = getPersistenceMode();

  const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);
  const config = await readJsonFile<AppConfig>(CONFIG_FILE, DEFAULT_CONFIG);

  if (mode === 'supabase-db') {
    await migrateConfigDb(config);
    if (leads.length > 0) await migrateLeadsDb(leads);
    else console.log('Nenhum lead em data/leads.json para migrar.');
  } else if (mode === 'supabase-storage') {
    await migrateConfigStorage(config);
    if (leads.length > 0) await migrateLeadsStorage(leads);
    else console.log('Nenhum lead em data/leads.json para migrar.');
  } else {
    console.error('Supabase não está ativo. Verifique backend/.env');
    process.exit(1);
  }

  console.log('\nMigração concluída!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
