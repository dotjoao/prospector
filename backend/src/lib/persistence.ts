import { readJsonFile } from '../utils/storage.js';
import { LEADS_FILE, CONFIG_FILE } from '../config/paths.js';
import { Lead, AppConfig } from '../types/index.js';
import { isSupabaseConfigured, getSupabase, leadToRow } from './supabase.js';
import {
  readStorageJson,
  STORAGE_LEADS_PATH,
  STORAGE_CONFIG_PATH,
} from './supabase-storage.js';
import { applyDatabaseSchema } from './apply-schema.js';
import { supabaseLeadsRepository } from '../repositories/leads.repository.js';
import { supabaseConfigRepository } from '../repositories/config.repository.js';

export type PersistenceMode = 'json' | 'supabase-db' | 'supabase-storage';

let mode: PersistenceMode = 'json';
let initialized = false;

const DEFAULT_CONFIG: AppConfig = {
  googlePlacesApiKey: '',
  defaultCity: 'Cuiabá',
  defaultState: 'MT',
  maxResults: 60,
  topProspects: 20,
  enableScreenshots: false,
};

async function checkSupabaseDbReady(): Promise<boolean> {
  const { error } = await getSupabase().from('app_settings').select('id').limit(1);
  if (!error) return true;
  if (error.code === 'PGRST205' || error.message.includes('does not exist')) return false;
  throw new Error(`[Supabase] Erro ao verificar banco: ${error.message}`);
}

async function migrateSourcesToDb(): Promise<void> {
  const dbCount = await supabaseLeadsRepository.countAll();
  if (dbCount > 0) {
    console.log(`[Persistência] PostgreSQL já tem ${dbCount} leads`);
    return;
  }

  const storageLeads = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
  const localLeads = await readJsonFile<Lead[]>(LEADS_FILE, []);
  const leads = storageLeads.length >= localLeads.length ? storageLeads : localLeads;

  if (leads.length > 0) {
    const rows = leads.map(leadToRow);
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await getSupabase()
        .from('leads')
        .upsert(batch, { onConflict: 'google_maps_url' });
      if (error) throw new Error(`Erro ao migrar leads para DB: ${error.message}`);
    }
    console.log(`[Persistência] ${leads.length} leads migrados → PostgreSQL`);
  }

  const storageConfig = await readStorageJson<AppConfig | null>(STORAGE_CONFIG_PATH, null);
  const localConfig = await readJsonFile<AppConfig>(CONFIG_FILE, DEFAULT_CONFIG);
  const config = storageConfig?.googlePlacesApiKey ? storageConfig : localConfig;

  if (config.googlePlacesApiKey) {
    await supabaseConfigRepository.updateConfig(config);
    console.log('[Persistência] Config migrada → PostgreSQL');
  }
}

export async function initPersistence(): Promise<PersistenceMode> {
  if (!isSupabaseConfigured()) {
    mode = 'json';
    initialized = true;
    return mode;
  }

  try {
    if (!(await checkSupabaseDbReady())) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[Persistência] Tabelas PostgreSQL não encontradas em produção.');
        console.warn('[Persistência] Execute as migrations no Supabase Dashboard.');
        mode = 'supabase-storage';
        initialized = true;
        return mode;
      }

      const created = await applyDatabaseSchema();
      if (created) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (await checkSupabaseDbReady()) {
      await migrateSourcesToDb();
      mode = 'supabase-db';
      console.log('[Persistência] Supabase PostgreSQL (tabelas)');
    } else {
      console.warn('[Persistência] Tabelas PostgreSQL não encontradas.');
      console.warn('[Persistência] Adicione SUPABASE_DB_PASSWORD em backend/.env e reinicie,');
      console.warn('[Persistência] ou execute o SQL em supabase/migrations/ no Dashboard.');
      mode = 'supabase-storage';
      console.log('[Persistência] Usando Supabase Storage temporariamente');
    }
  } catch (err) {
    console.warn('[Persistência] Falha no Supabase, usando JSON local:', (err as Error).message);
    mode = 'json';
  }

  initialized = true;
  return mode;
}

export function getPersistenceMode(): PersistenceMode {
  return mode;
}

export function isPersistenceInitialized(): boolean {
  return initialized;
}

export function usesSupabase(modeOverride?: PersistenceMode): boolean {
  const m = modeOverride ?? mode;
  return m === 'supabase-db' || m === 'supabase-storage';
}

export function getStorageLabel(modeOverride?: PersistenceMode): string {
  const m = modeOverride ?? mode;
  if (m === 'supabase-db' || m === 'supabase-storage') return 'supabase';
  return 'json';
}
