import 'dotenv/config';
import { applyDatabaseSchema } from '../src/lib/apply-schema.js';
import { getSupabase, isSupabaseConfigured } from '../src/lib/supabase.js';
import { initPersistence, getPersistenceMode } from '../src/lib/persistence.js';

async function tablesExist(): Promise<boolean> {
  const { error } = await getSupabase().from('app_settings').select('id').limit(1);
  if (!error) return true;
  if (error.message.includes('does not exist') || error.code === 'PGRST205') return false;
  throw new Error(`Erro ao verificar tabelas: ${error.message}`);
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY em backend/.env');
    process.exit(1);
  }

  console.log('[Setup] Verificando Supabase...');

  if (!(await tablesExist())) {
    console.log('[Setup] Criando tabelas PostgreSQL...');
    const ok = await applyDatabaseSchema();
    if (!ok) {
      console.error('\nNão foi possível criar tabelas automaticamente.');
      console.error('Adicione SUPABASE_DB_PASSWORD em backend/.env (Settings → Database)');
      console.error('Ou execute os arquivos em supabase/migrations/ no SQL Editor.\n');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 2000));
  } else {
    console.log('✓ Tabelas PostgreSQL já existem');
  }

  await initPersistence();
  console.log(`\n[Setup] Modo: ${getPersistenceMode()}`);
  console.log('[Setup] Rode npm run migrate:supabase se precisar reimportar dados\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
