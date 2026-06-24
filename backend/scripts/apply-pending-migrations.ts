import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const ref = 'hgpofqgcwmabcyiwkfvq';
const password = process.env.SUPABASE_DB_PASSWORD!;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../../supabase/migrations');

const client = new pg.Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
for (const file of ['002_performance.sql', '003_category_view.sql']) {
  let sql = await fs.readFile(path.join(dir, file), 'utf-8');
  sql = sql.replace(/^\uFEFF/, '');
  await client.query(sql);
  console.log('OK', file);
}
await client.end();
