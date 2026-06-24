import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations');

export async function applyDatabaseSchema(): Promise<boolean> {
  const password = process.env.SUPABASE_DB_PASSWORD;
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const ref = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
  if (!ref) throw new Error('SUPABASE_URL inválida');

  const clients: pg.Client[] = [];

  if (dbUrl) {
    clients.push(new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } }));
  }

  if (password) {
    const poolerHosts = [
      'aws-1-us-west-2.pooler.supabase.com',
      'aws-0-sa-east-1.pooler.supabase.com',
      'aws-1-sa-east-1.pooler.supabase.com',
      'aws-0-us-east-1.pooler.supabase.com',
      'aws-1-us-east-1.pooler.supabase.com',
    ];

    for (const host of poolerHosts) {
      clients.push(
        new pg.Client({
          host,
          port: 5432,
          user: `postgres.${ref}`,
          password,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 15000,
        })
      );
    }
  }

  if (clients.length === 0) return false;

  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

  for (const client of clients) {
    try {
      await client.connect();
      for (const file of files) {
        let sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
        sql = sql.replace(/^\uFEFF/, '');
        await client.query(sql);
        console.log(`[Schema] ✓ ${file}`);
      }
      await client.end();
      return true;
    } catch (err) {
      await client.end().catch(() => {});
      console.warn(`[Schema] Falha:`, (err as Error).message);
    }
  }

  return false;
}
