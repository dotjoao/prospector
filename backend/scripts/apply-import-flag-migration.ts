import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ref = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!ref || !password) process.exit(1);

const client = new pg.Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const sql = (await fs.readFile(
  path.resolve(__dirname, '../../supabase/migrations/005_leads_import_flag.sql'),
  'utf-8'
)).replace(/^\uFEFF/, '');
await client.query(sql);
console.log('[Schema] ✓ 005_leads_import_flag.sql');
await client.end();
